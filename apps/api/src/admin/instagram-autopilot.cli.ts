import 'reflect-metadata'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { Pool } from 'pg'
import { chromium } from 'playwright'
import brollLibrary from './broll-library.json'
import { speak, ttsConfig } from './elevenlabs'
import { feedFormat, pickCandidate, type Candidate, type Kind, type Target } from './instagram-autopilot'
import { buildReel, buildVoicedReel, frameJpeg } from './instagram-reel'
import {
  DISCORD_MAX_ATTACHMENT,
  SCENE_TAILS,
  VOICED_MAX_ATTEMPTS,
  feedSlotAction,
  isVoicedDay,
  pickClips,
  publishAt,
  shouldMakeVoiced,
  voicedLabel,
  voicedSeason,
  voicedSlot,
  type BrollClip,
  type SceneName,
  type ScheduledStatus,
} from './voiced-reel'
import { AUTOPILOT_SLOTS, InstagramService } from './instagram.service'
import { MAX_ATTEMPTS as SCHEDULED_MAX_ATTEMPTS, dueDecision, scheduledFormat } from './instagram-scheduled'

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

// Each country's autopilot posts on its own clock (noon / evening local time).
const TIME_ZONES: Record<string, string> = { DO: 'America/Santo_Domingo', CO: 'America/Bogota', MX: 'America/Mexico_City', US: 'America/New_York' }
const TZ = TIME_ZONES[process.env.COUNTRY_CODE ?? 'DO'] ?? 'America/Santo_Domingo'
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
  voicedPlan(slot: number, exclude: string[]): Promise<VoicedPlan | null>
  renderVoiced(plan: VoicedPlan, image: string | null, site: string, season: string | null): Promise<{ caption: string; scenes: Array<{ png: string; spoken: string; subtitle: string; scene: SceneName }> }>
}

// src/domain/voicedReel.ts VoicedPlan, the fields the worker reads.
interface VoicedPlan {
  kind: string
  productId: string
  name: string
  categoryId: string
  imageUrl: string | null
  store: string
  current: number
  before: number
  pct: number
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
const pngBuffer = (dataUrl: string) => Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64')

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

// ---------------------------------------------------------------------------
// Voiced Reels (Wednesday/Friday, DO stack): made in the morning, queued in
// instagram_scheduled for 19:00 and previewed on Discord, so there's time to
// cancel it in /admin/instagram. See voiced-reel.ts for the rules.

const COUNTRY = process.env.COUNTRY_CODE ?? 'DO'
const BROLL_DIR = process.env.BROLL_DIR || '/data/broll'
const VOICED_FAILED_KEY = 'ig_voiced_failed'
const RECENT_CLIPS_KEY = 'ig_voiced_recent_clips'
const RECENT_PRODUCTS_KEY = 'ig_voiced_recent_products'

async function setting(key: string): Promise<string | null> {
  const result = await pool.query<{ value: string }>('select value from app_settings where key = $1', [key])
  return result.rows[0]?.value ?? null
}

async function saveSetting(key: string, value: string) {
  await pool.query(
    `insert into app_settings(key, value, updated_at) values ($1, $2, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [key, value],
  )
}

async function recentList(key: string): Promise<string[]> {
  try {
    const list = JSON.parse((await setting(key)) ?? '[]')
    return Array.isArray(list) ? list.map(String) : []
  } catch {
    return []
  }
}

async function voicedFailures(): Promise<number> {
  const [date, count] = ((await setting(VOICED_FAILED_KEY)) ?? '').split(':')
  return date === today() ? Number(count) || 0 : 0
}

async function voicedStatus(): Promise<ScheduledStatus | null> {
  const result = await pool.query<{ status: ScheduledStatus }>(
    'select status from instagram_scheduled where label = $1 order by created_at desc limit 1',
    [voicedLabel(today())],
  )
  return result.rows[0]?.status ?? null
}

// Discord message with the video (or its cover when the video is too big).
async function notifyWithFile(content: string, file: { name: string; type: string; data: Buffer }) {
  const webhook = process.env.DISCORD_WEBHOOK_ALERTS
  if (!webhook) return
  const form = new FormData()
  form.append('payload_json', JSON.stringify({ content: content.slice(0, 1_900) }))
  form.append('files[0]', new Blob([new Uint8Array(file.data)], { type: file.type }), file.name)
  const response = await fetch(webhook, { method: 'POST', body: form }).catch(() => null)
  if (!response?.ok) await notify(content.slice(0, 1_900))
}

async function availableClips(): Promise<BrollClip[]> {
  const clips: BrollClip[] = []
  for (const clip of brollLibrary as BrollClip[]) {
    const ok = await access(join(BROLL_DIR, clip.file)).then(() => true, () => false)
    if (ok) clips.push(clip)
  }
  return clips
}

const rd = (n: number) => `RD$${Math.round(n).toLocaleString('en-US')}`

async function makeVoicedReel(weekday: number) {
  const tts = ttsConfig(process.env)
  if (!tts) throw new Error('falta ELEVENLABS_API_KEY en el .env')
  const library = await availableClips()
  if (library.length < 4) throw new Error(`hay ${library.length} clips en ${BROLL_DIR}; corre broll-fetch.cli.js`)

  const date = today()
  const slot = voicedSlot(date, weekday)
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  try {
    const page = await browser.newPage()
    await page.goto(`${siteUrl}/ig-render`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.waitForFunction(() => Boolean((window as unknown as { __ig?: unknown }).__ig), null, { timeout: 60_000 })
    const site = new URL(siteUrl).host.replace(/^www\./, '')

    const exclude = [...await recentlyPosted('feed'), ...await recentList(RECENT_PRODUCTS_KEY)]
    const plan = await bridge(page, 'voicedPlan', slot, exclude)
    if (!plan) throw new Error('no hay producto para el Reel con voz')
    const season = voicedSeason(date, process.env.VOICED_REEL_SIGNUP === '1')
    const rendered = await bridge(page, 'renderVoiced', plan, await imageDataUrl(plan.imageUrl), site, season)

    const recentClips = await recentList(RECENT_CLIPS_KEY)
    const clips = pickClips(library, rendered.scenes.map(s => ({ scene: s.scene, categoryId: plan.categoryId })), recentClips, slot, date)
    if (!clips) throw new Error('no hay clips para todas las escenas')

    let billed = 0
    const scenes = []
    for (const [i, scene] of rendered.scenes.entries()) {
      const voice = await speak(tts, scene.spoken)
      billed += voice.billed
      scenes.push({ png: pngBuffer(scene.png), audio: voice.file, clip: join(BROLL_DIR, clips[i].file), tail: SCENE_TAILS[scene.scene] })
    }
    const video = await buildVoicedReel(scenes)
    const cover = await frameJpeg(video, 1)

    const at = publishAt(date)
    await pool.query(
      `insert into instagram_scheduled (label, target, caption, image, video, publish_at)
       values ($1, 'feed', $2, $3, $4, $5)`,
      [voicedLabel(date), rendered.caption, cover, video, at],
    )
    await saveSetting(RECENT_CLIPS_KEY, JSON.stringify([...clips.map(c => c.id), ...recentClips].slice(0, 8)))
    await saveSetting(RECENT_PRODUCTS_KEY, JSON.stringify([plan.productId, ...await recentList(RECENT_PRODUCTS_KEY)].slice(0, 10)))
    console.log(`[ig-voiced] queued ${plan.kind} ${plan.name} for ${at.toISOString()} (${video.length} bytes, ${billed} chars billed)`)

    const message = [
      `🎙️ Reel con voz listo para hoy a las 19:00 — ${plan.name}`,
      `Tipo: ${plan.kind} · ${plan.store}: ${rd(plan.before)} → ${rd(plan.current)}${season ? ` · temporada ${season}` : ''}`,
      `Clips: ${clips.map(c => c.id).join(', ')} · voz: ${billed} caracteres de ElevenLabs`,
      'Para no publicarlo: /admin/instagram → Programados → Cancelar (ese día se publica el Reel normal).',
      '',
      rendered.caption,
    ].join('\n')
    const small = video.length <= DISCORD_MAX_ATTACHMENT
    await notifyWithFile(message, small ? { name: 'reel.mp4', type: 'video/mp4', data: video } : { name: 'portada.jpg', type: 'image/jpeg', data: cover })
  } finally {
    await browser.close()
  }
}

async function runVoiced(weekday: number) {
  const failures = await voicedFailures()
  if (!shouldMakeVoiced({ voicedDay: isVoicedDay(weekday, COUNTRY), hour: localHour(), existing: await voicedStatus(), failures })) return
  try {
    await makeVoicedReel(weekday)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const attempt = failures + 1
    await saveSetting(VOICED_FAILED_KEY, `${today()}:${attempt}`)
    console.error(`[ig-voiced] attempt ${attempt} failed:`, message)
    if (attempt >= VOICED_MAX_ATTEMPTS) {
      await notify(`⚠️ Reel con voz: no se pudo hacer hoy (${message}). Se publica el Reel normal, sin voz.`)
    }
  }
}

// Campaign posts queued in instagram_scheduled: published when their time
// comes, independent of the daily autopilot switch.
async function runScheduled(instagram: InstagramService) {
  const due = await pool.query<{ id: string; label: string; target: 'feed' | 'story'; caption: string; image: Buffer; video: Buffer | null; publish_at: Date; attempts: number }>(
    `select id::text, label, target, caption, image, video, publish_at, attempts
     from instagram_scheduled
     where status = 'scheduled' and publish_at <= now() and attempts < $1
     order by publish_at`,
    [SCHEDULED_MAX_ATTEMPTS],
  )
  for (const post of due.rows) {
    if (dueDecision(post.publish_at, new Date()) === 'missed') {
      await pool.query("update instagram_scheduled set status = 'missed' where id = $1", [post.id])
      await notify(`⚠️ Instagram programado: se pasó la hora y no se publicó "${post.label}" (${post.target}). Puedes publicarlo a mano desde /admin/instagram.`)
      continue
    }
    try {
      const result = await instagram.publishPost({
        productId: null,
        kind: 'promo',
        ...scheduledFormat(post),
        caption: post.target === 'story' ? post.caption || 'Historia' : post.caption,
        cover: post.image,
        media: post.video ? [{ contentType: 'video/mp4', data: post.video }] : [],
        publicBaseUrl: siteUrl,
        source: 'manual',
      })
      await pool.query("update instagram_scheduled set status = 'published', published_at = now(), attempts = attempts + 1, error = null where id = $1", [post.id])
      console.log(`[ig-scheduled] published ${post.label} (${post.target}) ${result.permalink ?? ''}`)
      await notify(`📅 Instagram programado: "${post.label}" (${post.target}) publicado${result.permalink ? `\n${result.permalink}` : ''}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const attempts = post.attempts + 1
      const giveUp = attempts >= SCHEDULED_MAX_ATTEMPTS
      await pool.query('update instagram_scheduled set attempts = $2, error = $3, status = $4 where id = $1', [post.id, attempts, message, giveUp ? 'failed' : 'scheduled'])
      console.error(`[ig-scheduled] ${post.label} failed:`, message)
      await notify(`⚠️ Instagram programado: falló "${post.label}" (${post.target}), intento ${attempts}/${SCHEDULED_MAX_ATTEMPTS}: ${message}` + (giveUp ? '\nNo se reintenta; puedes publicarlo a mano desde /admin/instagram.' : ''))
    }
  }
}

async function main() {
  const instagram = new InstagramService(pool)
  if (/^https:\/\//.test(siteUrl)) {
    await runScheduled(instagram).catch(error => console.error('[ig-scheduled] run failed:', error instanceof Error ? error.message : error))
  }
  // Daily follower count for the /admin growth chart -- even with the
  // autopilot off.
  await instagram.snapshotAccount().catch(error => console.warn('[ig-autopilot] follower snapshot failed:', error instanceof Error ? error.message : error))
  const { enabled } = await instagram.autopilot()
  if (!enabled) return
  if (!/^https:\/\//.test(siteUrl)) throw new Error('SITE_URL (https) is required')

  const weekday = localWeekday()
  await runVoiced(weekday)

  const hour = localHour()
  for (const slot of AUTOPILOT_SLOTS) {
    if (hour < slot.hour) continue
    const failed = await failedAttempts(slot.target)
    if (failed >= MAX_ATTEMPTS || await publishedToday(slot.target)) continue
    // On a voiced day the queued voiced Reel is the feed post.
    if (slot.target === 'feed') {
      const action = feedSlotAction({ voicedDay: isVoicedDay(weekday, COUNTRY), existing: await voicedStatus(), failures: await voicedFailures() })
      if (action !== 'post') continue
    }

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
