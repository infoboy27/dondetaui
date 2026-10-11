import { ConflictException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'

// Publishing through the Instagram API with Instagram Login (graph.instagram.com):
// works for Creator and Business accounts, no Facebook Page needed.
//   1. POST /{ig-user-id}/media         { image_url, caption } -> container id
//   2. poll the container until FINISHED
//   3. POST /{ig-user-id}/media_publish { creation_id }        -> media id
// Instagram downloads image_url itself, so the JPEG is served publicly from
// /api/ig-media/<post id>.jpg (InstagramMediaController).
//
// Config: IG_ACCESS_TOKEN (long-lived, 60 days). The token is refreshed here
// every ~30 days and the fresh one kept in app_settings, so after the first
// setup nobody has to paste a token again.

const GRAPH = 'https://graph.instagram.com'
const REFRESH_AFTER_DAYS = 30

export interface InstagramPostRow {
  id: string
  product_id: string | null
  kind: string
  target: string
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
      `select id::text, product_id::text, kind, target, caption, status, permalink, error, created_at, published_at
       from instagram_posts order by created_at desc limit $1`,
      [limit],
    )
    return result.rows
  }

  async image(id: string): Promise<Buffer | null> {
    const result = await this.pool.query<{ image: Buffer }>('select image from instagram_posts where id = $1', [id])
    return result.rows[0]?.image ?? null
  }

  async publish(input: { productId: string | null; kind: 'comparison' | 'drop'; target: 'feed' | 'story'; caption: string; jpeg: Buffer; publicBaseUrl: string; force?: boolean }) {
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
      `insert into instagram_posts(product_id, kind, target, caption, image) values ($1, $2, $3, $4, $5) returning id::text`,
      [input.productId, input.kind, input.target, input.caption, input.jpeg],
    )
    const postId = inserted.rows[0].id
    const imageUrl = `${input.publicBaseUrl}/api/ig-media/${postId}.jpg`

    try {
      const me = await graph<{ user_id?: string; id: string }>(`/me?fields=user_id&access_token=${encodeURIComponent(token)}`)
      const igUserId = me.user_id ?? me.id
      const form = (fields: Record<string, string>) => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ ...fields, access_token: token }),
      })
      // Stories take no caption; the feed post carries the text.
      const container = await graph<{ id: string }>(
        `/${igUserId}/media`,
        form(input.target === 'story' ? { image_url: imageUrl, media_type: 'STORIES' } : { image_url: imageUrl, caption: input.caption }),
      )

      // Stories take noticeably longer to process than feed photos (~30-40 s
      // measured); publishing before FINISHED fails with "The requested
      // resource does not exist". Stay under nginx's 90 s /api timeout.
      const deadline = Date.now() + (input.target === 'story' ? 75_000 : 45_000)
      let finished = false
      while (Date.now() < deadline) {
        const state = await graph<{ status_code?: string; status?: string }>(`/${container.id}?fields=status_code,status&access_token=${encodeURIComponent(token)}`)
        if (state.status_code === 'FINISHED') {
          finished = true
          break
        }
        if (state.status_code === 'ERROR' || state.status_code === 'EXPIRED') throw new Error(`Instagram no pudo procesar la imagen (${state.status ?? state.status_code})`)
        await new Promise(resolve => setTimeout(resolve, 3_000))
      }
      if (!finished) throw new Error('Instagram todavía está procesando la imagen. Intenta publicar de nuevo en un minuto.')

      const media = await graph<{ id: string }>(`/${igUserId}/media_publish`, form({ creation_id: container.id }))
      const details = await graph<{ permalink?: string }>(`/${media.id}?fields=permalink&access_token=${encodeURIComponent(token)}`).catch(() => ({ permalink: undefined }))
      await this.pool.query(
        `update instagram_posts set status = 'published', ig_media_id = $2, permalink = $3, published_at = now() where id = $1`,
        [postId, media.id, details.permalink ?? null],
      )
      return { id: postId, status: 'published', permalink: details.permalink ?? null }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await this.pool.query(`update instagram_posts set status = 'failed', error = $2 where id = $1`, [postId, message.slice(0, 1_000)])
      throw new ServiceUnavailableException(message)
    }
  }
}
