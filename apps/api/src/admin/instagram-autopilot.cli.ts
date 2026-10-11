import 'reflect-metadata'
import { Pool } from 'pg'
import { chromium } from 'playwright'
import { pickCandidate, type Candidate, type Kind, type Target } from './instagram-autopilot'
import { AUTOPILOT_SLOTS, InstagramService } from './instagram.service'

// Instagram autopilot, run every few minutes by deploy/instagram-autopilot-loop.sh.
// Does nothing unless switched on from /admin/instagram (app_settings
// ig_autopilot = 'on'). For each slot whose hour has come (Dominican time)
// and that has nothing published today -- by hand or by the autopilot -- it:
//   1. opens SITE_URL/ig-render in Chromium (the same card code as the portal),
//   2. picks the best candidate not posted recently,
//   3. publishes it through InstagramService and reports to Discord.
// A slot that fails is retried on later runs, at most MAX_ATTEMPTS times a day.

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/+$/, '')
const pool = new Pool({ connectionString: databaseUrl, max: 2 })

const TZ = 'America/Santo_Domingo'
const MAX_ATTEMPTS = 3
// Don't repeat a product for this long (feed) / across any target.
const FEED_REPEAT_DAYS = 14
const ANY_REPEAT_DAYS = 7
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function localHour(): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' }).format(new Date()))
}

async function notify(content: string) {
  const webhook = process.env.DISCORD_WEBHOOK_ALERTS
  if (!webhook) return
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).catch(() => undefined)
}

function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

async function publishedToday(target: Target): Promise<boolean> {
  const result = await pool.query(
    `select 1 from instagram_posts
     where target = $1 and status = 'published'
       and (published_at at time zone '${TZ}')::date = (now() at time zone '${TZ}')::date
     limit 1`,
    [target],
  )
  return result.rows.length > 0
}

// Failed attempts per slot and day, kept in app_settings as "<date>:<n>" --
// not counted from instagram_posts, because a failure before the post row
// exists (Chromium, rendering) must count too.
async function failedAttempts(target: Target): Promise<number> {
  const result = await pool.query<{ value: string }>('select value from app_settings where key = $1', [`ig_autopilot_failed_${target}`])
  const [date, count] = (result.rows[0]?.value ?? '').split(':')
  return date === today() ? Number(count) || 0 : 0
}

async function recordFailure(target: Target, attempt: number) {
  await pool.query(
    `insert into app_settings(key, value, updated_at) values ($1, $2, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [`ig_autopilot_failed_${target}`, `${today()}:${attempt}`],
  )
}

async function recentlyPosted(target: Target): Promise<Set<string>> {
  const result = await pool.query<{ product_id: string }>(
    `select distinct product_id::text from instagram_posts
     where status = 'published' and product_id is not null
       and (published_at > now() - make_interval(days => $2)
            or (target = $1 and published_at > now() - make_interval(days => $3)))`,
    [target, ANY_REPEAT_DAYS, target === 'feed' ? FEED_REPEAT_DAYS : ANY_REPEAT_DAYS],
  )
  return new Set(result.rows.map(r => r.product_id))
}

async function imageDataUrl(url: string | null): Promise<string | null> {
  if (!url || !/^https:\/\//i.test(url)) return null
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000), headers: { 'User-Agent': 'Mozilla/5.0 (DondeTa)' } })
    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || !type.startsWith('image/')) return null
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > MAX_IMAGE_BYTES) return null
    return `data:${type.split(';')[0]};base64,${bytes.toString('base64')}`
  } catch {
    return null
  }
}

async function publishSlot(instagram: InstagramService, target: Target) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  try {
    const page = await browser.newPage()
    await page.goto(`${siteUrl}/ig-render`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.waitForFunction(() => Boolean((window as unknown as { __ig?: unknown }).__ig), null, { timeout: 60_000 })
    const candidates = await page.evaluate(() => (window as unknown as { __ig: { candidates(): Promise<Candidate[]> } }).__ig.candidates())
    const pick = pickCandidate(candidates, target, await recentlyPosted(target))
    if (!pick) {
      console.log(`[ig-autopilot] ${target}: nothing new to post today`)
      return null
    }

    const site = new URL(siteUrl).host.replace(/^www\./, '')
    const image = await imageDataUrl(pick.imageUrl)
    const rendered = await page.evaluate(
      ([productId, kind, img, siteHost]) =>
        (window as unknown as { __ig: { render(a: string, b: Kind, c: string | null, d: string): Promise<{ caption: string; feed: string; story: string }> } })
          .__ig.render(productId, kind, img, siteHost),
      [pick.productId, pick.kind, image, site] as const,
    )
    const jpeg = Buffer.from((target === 'story' ? rendered.story : rendered.feed).replace(/^data:image\/jpeg;base64,/, ''), 'base64')
    const result = await instagram.publish({
      productId: pick.productId,
      kind: pick.kind.type,
      target,
      caption: rendered.caption,
      jpeg,
      publicBaseUrl: siteUrl,
      source: 'autopilot',
    })
    return { pick, permalink: result.permalink, hadImage: Boolean(image) }
  } finally {
    await browser.close()
  }
}

async function main() {
  const instagram = new InstagramService(pool)
  const { enabled } = await instagram.autopilot()
  if (!enabled) return
  if (!/^https:\/\//.test(siteUrl)) throw new Error('SITE_URL (https) is required')

  const hour = localHour()
  for (const slot of AUTOPILOT_SLOTS) {
    if (hour < slot.hour) continue
    const failed = await failedAttempts(slot.target)
    if (failed >= MAX_ATTEMPTS || await publishedToday(slot.target)) continue

    const label = slot.target === 'story' ? 'historia' : 'post'
    try {
      const done = await publishSlot(instagram, slot.target)
      if (!done) continue
      console.log(`[ig-autopilot] ${slot.target}: published ${done.pick.name} ${done.permalink ?? ''}`)
      await notify(
        `📸 Instagram automático: ${label} publicado — ${done.pick.name}` +
        (done.hadImage ? '' : ' (sin foto)') +
        (done.permalink ? `\n${done.permalink}` : ''),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[ig-autopilot] ${slot.target} failed:`, message)
      const attempt = failed + 1
      await recordFailure(slot.target, attempt)
      await notify(
        `⚠️ Instagram automático: falló el ${label} (intento ${attempt}/${MAX_ATTEMPTS}): ${message}` +
        (attempt >= MAX_ATTEMPTS ? '\nNo se reintenta hasta mañana; puedes publicar a mano desde /admin/instagram.' : ''),
      )
    }
  }
}

main()
  .catch(error => {
    console.error('[ig-autopilot] failed:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
