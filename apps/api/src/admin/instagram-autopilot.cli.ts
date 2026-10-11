import 'reflect-metadata'
import { Pool } from 'pg'
import { chromium } from 'playwright'
import { feedFormat, pickCandidate, type Candidate, type Kind, type Target } from './instagram-autopilot'
import { buildReel } from './instagram-reel'
import { AUTOPILOT_SLOTS, InstagramService } from './instagram.service'

// Instagram autopilot, run every few minutes by deploy/instagram-autopilot-loop.sh.
// Does nothing unless switched on from /admin/instagram (app_settings
// ig_autopilot = 'on'). For each slot whose hour has come (Dominican time)
// and that has nothing published today -- by hand or by the autopilot -- it:
//   1. opens SITE_URL/ig-render in Chromium (the same card code as the portal),
//   2. picks the best candidate not posted recently -- or, for the feed, the
//      day's format (feedFormat): Sunday's "Top 5" carousel, a Reel rendered
//      with ffmpeg (instagram-reel.ts), or the plain image,
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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
function localWeekday(): number {
  return WEEKDAYS.indexOf(new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(new Date()))
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

type Page = Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>

// window.__ig, as seen from Node (src/screens/admin/IgRender.tsx).
interface Bridge {
  candidates(): Promise<Candidate[]>
  render(productId: string, kind: Kind, image: string | null, site: string): Promise<{ caption: string; feed: string; story: string }>
  weekly(): Promise<{ slug: string; label: string; items: Array<{ productId: string; name: string; imageUrl: string | null }> } | null>
  renderCarousel(slug: string, images: Record<string, string | null>, site: string): Promise<{ caption: string; slides: string[] }>
  renderReel(productId: string, kind: Kind, image: string | null, site: string): Promise<{ caption: string; scenes: Array<{ image: string; seconds: number; zoom: boolean }> }>
}

function bridge<K extends keyof Bridge>(page: Page, method: K, ...args: Parameters<Bridge[K]>): Promise<Awaited<ReturnType<Bridge[K]>>> {
  return page.evaluate(
    ([name, params]) => {
      const ig = (window as unknown as { __ig: Record<string, (...a: unknown[]) => unknown> }).__ig
      return ig[name](...params)
    },
    [method, args] as [string, unknown[]],
  ) as Promise<Awaited<ReturnType<Bridge[K]>>>
}

const jpegBuffer = (dataUrl: string) => Buffer.from(dataUrl.replace(/^data:image\/jpeg;base64,/, ''), 'base64')

interface Published {
  label: string
  name: string
  permalink: string | null
  hadImage: boolean
  note?: string
}

async function publishCarousel(page: Page, instagram: InstagramService, site: string): Promise<Published | null> {
  const weekly = await bridge(page, 'weekly')
  if (!weekly) return null
  const images: Record<string, string | null> = {}
  for (const item of weekly.items) images[item.productId] = await imageDataUrl(item.imageUrl)
  const rendered = await bridge(page, 'renderCarousel', weekly.slug, images, site)
  const slides = rendered.slides.map(jpegBuffer)
  const result = await instagram.publishPost({
    productId: null,
    kind: 'top5',
    target: 'feed',
    format: 'carousel',
    caption: rendered.caption,
    cover: slides[0],
    media: slides.map(data => ({ contentType: 'image/jpeg' as const, data })),
    publicBaseUrl: siteUrl,
    source: 'autopilot',
  })
  return {
    label: 'carrusel',
    name: `Top 5 ${weekly.label}`,
    permalink: result.permalink,
    hadImage: Object.values(images).every(Boolean),
  }
}

async function publishProduct(page: Page, instagram: InstagramService, target: Target, format: 'image' | 'reel', site: string): Promise<Published | null> {
  const candidates = await bridge(page, 'candidates')
  const pick = pickCandidate(candidates, target, await recentlyPosted(target))
  if (!pick) return null
  const image = await imageDataUrl(pick.imageUrl)

  if (format === 'reel') {
    const rendered = await bridge(page, 'renderReel', pick.productId, pick.kind, image, site)
    const scenes = rendered.scenes.map(scene => ({ jpeg: jpegBuffer(scene.image), seconds: scene.seconds, zoom: scene.zoom }))
    const video = await buildReel(scenes)
    const result = await instagram.publishPost({
      productId: pick.productId,
      kind: pick.kind.type,
      target: 'feed',
      format: 'reel',
      caption: rendered.caption,
      cover: scenes[0].jpeg,
      media: [{ contentType: 'video/mp4', data: video }],
      publicBaseUrl: siteUrl,
      source: 'autopilot',
    })
    return { label: 'reel', name: pick.name, permalink: result.permalink, hadImage: Boolean(image) }
  }

  const rendered = await bridge(page, 'render', pick.productId, pick.kind, image, site)
  const result = await instagram.publish({
    productId: pick.productId,
    kind: pick.kind.type,
    target,
    caption: rendered.caption,
    jpeg: jpegBuffer(target === 'story' ? rendered.story : rendered.feed),
    publicBaseUrl: siteUrl,
    source: 'autopilot',
  })
  return { label: target === 'story' ? 'historia' : 'post', name: pick.name, permalink: result.permalink, hadImage: Boolean(image) }
}

async function publishSlot(instagram: InstagramService, target: Target): Promise<Published | null> {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  try {
    const page = await browser.newPage()
    await page.goto(`${siteUrl}/ig-render`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.waitForFunction(() => Boolean((window as unknown as { __ig?: unknown }).__ig), null, { timeout: 60_000 })
    const site = new URL(siteUrl).host.replace(/^www\./, '')

    const format = target === 'feed' ? feedFormat(localWeekday()) : 'image'
    // A carousel or Reel that can't be made (not enough products of the
    // week's type, ffmpeg, Instagram rejecting the video) shouldn't cost the
    // day's post: fall back to the plain image, and say why.
    let note: string | undefined
    if (format !== 'image') {
      try {
        const done = format === 'carousel' ? await publishCarousel(page, instagram, site) : await publishProduct(page, instagram, target, 'reel', site)
        if (done) return done
        note = `sin ${format === 'carousel' ? 'top semanal' : 'candidato para reel'}`
      } catch (error) {
        note = `${format} falló: ${error instanceof Error ? error.message : String(error)}`
        console.warn(`[ig-autopilot] ${note}`)
      }
    }
    const done = await publishProduct(page, instagram, target, 'image', site)
    if (!done) console.log(`[ig-autopilot] ${target}: nothing new to post today`)
    return done && { ...done, note }
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
      console.log(`[ig-autopilot] ${slot.target}: published ${done.label} ${done.name} ${done.permalink ?? ''}`)
      await notify(
        `📸 Instagram automático: ${done.label} publicado — ${done.name}` +
        (done.hadImage ? '' : ' (sin foto)') +
        (done.note ? `\n(se publicó como imagen: ${done.note})` : '') +
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
