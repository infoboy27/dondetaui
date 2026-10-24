import { ConflictException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import { instagramSessions } from './google-analytics'
import { FacebookService } from './facebook.service'
import { breakdown, byFormat, mediaFormat, series, totals, type InstagramInsights, type MediaRow, type PostStats } from './instagram-insights'

// Publishing through the Instagram API with Instagram Login (graph.instagram.com):
// works for Creator and Business accounts, no Facebook Page needed.
//   1. POST /{ig-user-id}/media         { image_url, caption } -> container id
//      (a carousel creates one container per slide first, then the parent;
//      a Reel passes video_url + media_type=REELS)
//   2. poll the container until FINISHED
//   3. POST /{ig-user-id}/media_publish { creation_id }        -> media id
// Instagram downloads the files itself, so they're served publicly from
// /api/ig-media/<post id>.jpg and <post id>-<n>.(jpg|mp4) (InstagramMediaController).
//
// Config: IG_ACCESS_TOKEN (long-lived, 60 days). The token is refreshed here
// every ~30 days and the fresh one kept in app_settings, so after the first
// setup nobody has to paste a token again.

const GRAPH = 'https://graph.instagram.com'
const REFRESH_AFTER_DAYS = 30

// Autopilot schedule, in Dominican time (UTC-4, no DST): the feed post at
// noon, the story in the evening. instagram-autopilot.cli.ts posts each one at
// most once a day, and skips a slot that was already published by hand.
export const AUTOPILOT_SLOTS = [
  { target: 'feed' as const, hour: Number(process.env.IG_AUTOPILOT_FEED_HOUR ?? 12) },
  { target: 'story' as const, hour: Number(process.env.IG_AUTOPILOT_STORY_HOUR ?? 19) },
]

export type PostKind = 'comparison' | 'drop' | 'top5' | 'promo'
export type PostFormat = 'image' | 'carousel' | 'reel'
export interface MediaFile {
  contentType: 'image/jpeg' | 'video/mp4'
  data: Buffer
}

export interface InstagramPostRow {
  id: string
  product_id: string | null
  kind: string
  target: string
  format: string
  source: string
  caption: string
  status: string
  permalink: string | null
  error: string | null
  created_at: Date
  published_at: Date | null
}

async function graph<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${GRAPH}${path}`, { ...init, signal: AbortSignal.timeout(30_000) })
  const body = await response.json().catch(() => ({})) as T & { error?: { message?: string } }
  if (!response.ok || body.error) {
    throw new Error(`Instagram API: ${body.error?.message ?? response.status}`)
  }
  return body
}

@Injectable()
export class InstagramService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  private async setting(key: string): Promise<{ value: string; updatedAt: Date } | null> {
    const result = await this.pool.query<{ value: string; updated_at: Date }>('select value, updated_at from app_settings where key = $1', [key])
    return result.rows[0] ? { value: result.rows[0].value, updatedAt: result.rows[0].updated_at } : null
  }

  private async saveSetting(key: string, value: string) {
    await this.pool.query(
      `insert into app_settings(key, value, updated_at) values ($1, $2, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [key, value],
    )
  }

  // The stored (refreshed) token wins over the env one -- unless the env
  // token was changed by hand, which means a new account/token was set up.
  private async accessToken(): Promise<string | null> {
    const envToken = process.env.IG_ACCESS_TOKEN?.trim() || null
    const stored = await this.setting('ig_access_token')
    const seed = await this.setting('ig_env_token_seed')
    let token = stored?.value ?? envToken
    let age = stored ? (Date.now() - stored.updatedAt.getTime()) / 86_400_000 : 0
    if (envToken && seed?.value !== envToken) {
      // A newly pasted token: adopt it as-is (Instagram only refreshes tokens
      // older than 24 h, so there's nothing to refresh yet).
      token = envToken
      age = 0
      await this.saveSetting('ig_env_token_seed', envToken)
      await this.saveSetting('ig_access_token', envToken)
    }
    if (!token) return null

    if (age > REFRESH_AFTER_DAYS) {
      try {
        const refreshed = await graph<{ access_token: string }>(
          `/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`,
        )
        token = refreshed.access_token
        await this.saveSetting('ig_access_token', token)
      } catch (error) {
        console.warn('[instagram] token refresh failed:', error instanceof Error ? error.message : error)
      }
    }
    return token
  }

  async status() {
    const token = await this.accessToken()
    if (!token) return { configured: false as const }
    try {
      const me = await graph<{ user_id?: string; id: string; username: string }>(`/me?fields=user_id,username&access_token=${encodeURIComponent(token)}`)
      const stored = await this.setting('ig_access_token')
      return { configured: true as const, username: me.username, tokenUpdatedAt: stored?.updatedAt.toISOString() ?? null }
    } catch (error) {
      return { configured: true as const, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async history(limit = 30): Promise<InstagramPostRow[]> {
    const result = await this.pool.query<InstagramPostRow>(
      `select id::text, product_id::text, kind, target, format, source, caption, status, permalink, error, created_at, published_at
       from instagram_posts order by created_at desc limit $1`,
      [limit],
    )
    return result.rows
  }

  // The country's Facebook Page, fed by every feed post (see facebook.service.ts).
  async facebook() {
    const facebook = new FacebookService(this.pool)
    return { ...(await facebook.status()), history: await facebook.history() }
  }

  setFacebook(enabled: boolean) {
    return new FacebookService(this.pool).setEnabled(enabled)
  }

  async autopilot() {
    const setting = await this.setting('ig_autopilot')
    return { enabled: setting?.value === 'on', slots: AUTOPILOT_SLOTS }
  }

  async setAutopilot(enabled: boolean) {
    await this.saveSetting('ig_autopilot', enabled ? 'on' : 'off')
    return this.autopilot()
  }

  // One row per day with the follower count, so /admin can chart growth
  // (Instagram itself only reports daily new followers). Called from the
  // autopilot loop and whenever the insights are loaded; a no-op once today's
  // row exists.
  async snapshotAccount(): Promise<void> {
    const today = await this.pool.query(`select 1 from instagram_account_daily where day = (now() at time zone 'America/Santo_Domingo')::date`)
    if (today.rows.length) return
    const token = await this.accessToken()
    if (!token) return
    const me = await graph<{ followers_count?: number; media_count?: number }>(`/me?fields=followers_count,media_count&access_token=${encodeURIComponent(token)}`)
    await this.pool.query(
      `insert into instagram_account_daily(day, followers, media_count)
       values ((now() at time zone 'America/Santo_Domingo')::date, $1, $2)
       on conflict (day) do nothing`,
      [me.followers_count ?? 0, me.media_count ?? 0],
    )
  }

  // ~20 Graph calls per load (account, insights, one per recent post), well
  // inside the 200/hour limit -- but cached so reloading the portal is free.
  private insightsCache: { at: number; value: Promise<InstagramInsights> } | null = null

  insights(): Promise<InstagramInsights> {
    if (!this.insightsCache || Date.now() - this.insightsCache.at > 15 * 60_000) {
      const value = this.loadInsights()
      value.catch(() => { this.insightsCache = null })
      this.insightsCache = { at: Date.now(), value }
    }
    return this.insightsCache.value
  }

  private async loadInsights(): Promise<InstagramInsights> {
    const token = await this.accessToken()
    if (!token) throw new ServiceUnavailableException('Instagram no está conectado (falta IG_ACCESS_TOKEN)')
    const get = <T>(path: string) => graph<T>(`${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`)
    // A metric Instagram won't give (too few followers, new account) just
    // comes back empty instead of failing the whole page.
    const maybe = <T>(path: string) => get<{ data: T[] }>(path).then(r => r.data).catch(() => undefined)

    await this.snapshotAccount().catch(() => undefined)
    const now = Math.floor(Date.now() / 1000)
    const ago = (days: number) => now - days * 86_400
    const totalsFor = (days: number) => `/me/insights?metric=reach,views,accounts_engaged,total_interactions,profile_links_taps&period=day&metric_type=total_value&since=${ago(days)}&until=${now}`
    const followsFor = (days: number) => `/me/insights?metric=follows_and_unfollows&period=day&metric_type=total_value&breakdown=follow_type&since=${ago(days)}&until=${now}`
    const demographics = (by: string) => `/me/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=${by}&timeframe=this_month`

    type Metric = Parameters<typeof totals>[0][number]
    const [account, week, weekFollows, month, monthFollows, reachSeries, followerSeries, cities, ages, genders, media, history, ours, siteVisits] = await Promise.all([
      get<{ username: string; followers_count?: number; follows_count?: number; media_count?: number }>('/me?fields=username,followers_count,follows_count,media_count'),
      maybe<Metric>(totalsFor(7)),
      maybe<Metric>(followsFor(7)),
      maybe<Metric>(totalsFor(28)),
      maybe<Metric>(followsFor(28)),
      maybe<{ name: string; values?: Array<{ value: number; end_time?: string }> }>(`/me/insights?metric=reach&period=day&since=${ago(28)}&until=${now}`),
      maybe<{ name: string; values?: Array<{ value: number; end_time?: string }> }>(`/me/insights?metric=follower_count&period=day&since=${ago(29)}&until=${now}`),
      maybe<Metric>(demographics('city')),
      maybe<Metric>(demographics('age')),
      maybe<Metric>(demographics('gender')),
      get<{ data: MediaRow[] }>('/me/media?fields=id,media_type,media_product_type,timestamp,permalink,caption,like_count,comments_count&limit=24').then(r => r.data),
      this.pool.query<{ day: string; followers: number }>(`select day::text, followers from instagram_account_daily where day > current_date - 90 order by day`),
      this.pool.query<{ ig_media_id: string; source: 'manual' | 'autopilot' }>(`select ig_media_id, source from instagram_posts where ig_media_id is not null`),
      instagramSessions(28).catch(() => null),
    ])

    const sourceByMedia = new Map(ours.rows.map(r => [r.ig_media_id, r.source]))
    const posts: PostStats[] = await Promise.all(media.map(async item => {
      type PostMetric = { name: string; values?: Array<{ value: number }> }
      const metrics = await maybe<PostMetric>(`/${item.id}/insights?metric=reach,views,saved,shares,total_interactions`)
        ?? await maybe<PostMetric>(`/${item.id}/insights?metric=reach`)
        ?? []
      const value = (name: string) => metrics.find(m => m.name === name)?.values?.[0]?.value ?? 0
      return {
        id: item.id,
        permalink: item.permalink ?? null,
        timestamp: item.timestamp,
        format: mediaFormat(item),
        title: (item.caption ?? '').split('\n')[0].slice(0, 120),
        source: sourceByMedia.get(item.id) ?? null,
        reach: value('reach'),
        views: value('views'),
        likes: item.like_count ?? 0,
        comments: item.comments_count ?? 0,
        saved: value('saved'),
        shares: value('shares'),
        interactions: value('total_interactions'),
      }
    }))

    const genderLabel = (key: string) => (key === 'M' ? 'Hombres' : key === 'F' ? 'Mujeres' : 'Sin especificar')
    const cityLabel = (key: string) => key.split(',')[0]
    return {
      generatedAt: new Date().toISOString(),
      account: { username: account.username, followers: account.followers_count ?? 0, follows: account.follows_count ?? 0, mediaCount: account.media_count ?? 0 },
      week: totals(week ?? [], weekFollows),
      month: totals(month ?? [], monthFollows),
      reachByDay: series(reachSeries),
      newFollowersByDay: series(followerSeries),
      followersHistory: history.rows.map(r => ({ date: r.day, value: r.followers })),
      cities: breakdown(cities, 8, cityLabel),
      ages: breakdown(ages, 8).sort((a, b) => a.label.localeCompare(b.label)),
      genders: breakdown(genders, 3, genderLabel),
      posts,
      byFormat: byFormat(posts),
      siteVisits,
    }
  }

  async image(id: string): Promise<Buffer | null> {
    const result = await this.pool.query<{ image: Buffer }>('select image from instagram_posts where id = $1', [id])
    return result.rows[0]?.image ?? null
  }

  async media(id: string, position: number): Promise<MediaFile | null> {
    const result = await this.pool.query<{ content_type: MediaFile['contentType']; data: Buffer }>(
      'select content_type, data from instagram_post_media where post_id = $1 and position = $2',
      [id, position],
    )
    const row = result.rows[0]
    return row ? { contentType: row.content_type, data: row.data } : null
  }

  // A single image to the feed or to Stories (the admin portal's publish button).
  publish(input: { productId: string | null; kind: 'comparison' | 'drop'; target: 'feed' | 'story'; caption: string; jpeg: Buffer; publicBaseUrl: string; force?: boolean; source?: 'manual' | 'autopilot' }) {
    return this.publishPost({ ...input, format: 'image', cover: input.jpeg, media: [] })
  }

  // Any format. `cover` is what the admin history shows (and a Reel's cover
  // frame); `media` holds the carousel slides, or the Reel's video.
  async publishPost(input: {
    productId: string | null
    kind: PostKind
    target: 'feed' | 'story'
    format: PostFormat
    caption: string
    cover: Buffer
    media: MediaFile[]
    publicBaseUrl: string
    force?: boolean
    source?: 'manual' | 'autopilot'
  }) {
    const token = await this.accessToken()
    if (!token) throw new ServiceUnavailableException('Instagram no está conectado (falta IG_ACCESS_TOKEN)')

    // The same product, same kind, already published in the last 24 h:
    // most likely a double click.
    if (input.productId && !input.force) {
      const recent = await this.pool.query(
        `select 1 from instagram_posts where product_id = $1 and kind = $2 and target = $3 and status = 'published'
           and published_at > now() - interval '24 hours' limit 1`,
        [input.productId, input.kind, input.target],
      )
      if (recent.rows.length) {
        throw new ConflictException(input.target === 'story' ? 'Esta historia ya se publicó en las últimas 24 horas' : 'Este producto ya se publicó en las últimas 24 horas')
      }
    }

    const inserted = await this.pool.query<{ id: string }>(
      `insert into instagram_posts(product_id, kind, target, format, caption, image, source) values ($1, $2, $3, $4, $5, $6, $7) returning id::text`,
      [input.productId, input.kind, input.target, input.format, input.caption, input.cover, input.source ?? 'manual'],
    )
    const postId = inserted.rows[0].id
    for (const [position, file] of input.media.entries()) {
      await this.pool.query(
        'insert into instagram_post_media(post_id, position, content_type, data) values ($1, $2, $3, $4)',
        [postId, position, file.contentType, file.data],
      )
    }
    const base = `${input.publicBaseUrl}/api/ig-media/${postId}`
    const mediaUrl = (position: number) => `${base}-${position}.${input.media[position].contentType === 'video/mp4' ? 'mp4' : 'jpg'}`

    try {
      const me = await graph<{ user_id?: string; id: string }>(`/me?fields=user_id&access_token=${encodeURIComponent(token)}`)
      const igUserId = me.user_id ?? me.id
      const form = (fields: Record<string, string>) => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ ...fields, access_token: token }),
      })
      const create = (fields: Record<string, string>) => graph<{ id: string }>(`/${igUserId}/media`, form(fields))

      // Instagram processes every container asynchronously; publishing before
      // FINISHED fails with "The requested resource does not exist". Stories
      // take ~30-40 s and must stay under nginx's 90 s /api timeout when
      // published by hand; Reels (autopilot only, no HTTP request waiting)
      // can take minutes to transcode.
      const waitFor = async (containerId: string, timeoutMs: number) => {
        const deadline = Date.now() + timeoutMs
        while (Date.now() < deadline) {
          const state = await graph<{ status_code?: string; status?: string }>(`/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(token)}`)
          if (state.status_code === 'FINISHED') return
          if (state.status_code === 'ERROR' || state.status_code === 'EXPIRED') throw new Error(`Instagram no pudo procesar el archivo (${state.status ?? state.status_code})`)
          await new Promise(resolve => setTimeout(resolve, input.format === 'reel' ? 10_000 : 3_000))
        }
        throw new Error('Instagram todavía está procesando el archivo. Intenta publicar de nuevo en un minuto.')
      }

      let container: { id: string }
      if (input.format === 'carousel') {
        const children: string[] = []
        for (const position of input.media.keys()) {
          const child = await create({ image_url: mediaUrl(position), is_carousel_item: 'true' })
          await waitFor(child.id, 45_000)
          children.push(child.id)
        }
        container = await create({ media_type: 'CAROUSEL', children: children.join(','), caption: input.caption })
        await waitFor(container.id, 60_000)
      } else if (input.format === 'reel') {
        container = await create({ media_type: 'REELS', video_url: mediaUrl(0), cover_url: `${base}.jpg`, caption: input.caption, share_to_feed: 'true' })
        await waitFor(container.id, 5 * 60_000)
      } else {
        // Stories take no caption; the feed post carries the text.
        container = await create(input.target === 'story' ? { image_url: `${base}.jpg`, media_type: 'STORIES' } : { image_url: `${base}.jpg`, caption: input.caption })
        await waitFor(container.id, input.target === 'story' ? 75_000 : 45_000)
      }

      const media = await graph<{ id: string }>(`/${igUserId}/media_publish`, form({ creation_id: container.id }))
      const details = await graph<{ permalink?: string }>(`/${media.id}?fields=permalink&access_token=${encodeURIComponent(token)}`).catch(() => ({ permalink: undefined }))
      await this.pool.query(
        `update instagram_posts set status = 'published', ig_media_id = $2, permalink = $3, published_at = now() where id = $1`,
        [postId, media.id, details.permalink ?? null],
      )
      // The country's Facebook Page gets the same post (feed only; best effort, never fails this one).
      if (input.target === 'feed') {
        const photoUrls = input.format === 'carousel' ? [...input.media.keys()].map(mediaUrl) : [`${base}.jpg`]
        await new FacebookService(this.pool).crossPost({
          instagramPostId: postId, format: input.format, caption: input.caption, productId: input.productId,
          photoUrls, videoUrl: input.format === 'reel' ? mediaUrl(0) : null, siteUrl: input.publicBaseUrl,
        })
      }
      return { id: postId, status: 'published', permalink: details.permalink ?? null }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await this.pool.query(`update instagram_posts set status = 'failed', error = $2 where id = $1`, [postId, message.slice(0, 1_000)])
      throw new ServiceUnavailableException(message)
    }
  }
}
