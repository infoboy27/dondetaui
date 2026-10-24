import type { Pool } from 'pg'
import { facebookCaption, facebookLink } from './facebook-caption'

// Cross-posts what the Instagram publisher just published to the country's Facebook
// Page, through the Graph API (Page access token, permissions pages_manage_posts and
// pages_read_engagement; while the Meta app is in development mode and its admin owns
// the Page, no app review is needed).
//   photo     POST /{page}/photos   { url, caption }
//   carousel  POST /{page}/photos   { url, published=false } per slide, then
//             POST /{page}/feed     { message, attached_media[i] }
//   video     POST /{page}/videos   { file_url, description }
// Meta downloads the files itself from the same public /api/ig-media URLs Instagram uses.
// Stories are not cross-posted (Facebook Stories have no publishing API).
//
// Config per stack (each country has its own Page): FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN.
// The switch lives in app_settings ('fb_crosspost' = 'on'), next to the Instagram one.
// A failure never fails the Instagram post: it is logged in facebook_posts.

const GRAPH = 'https://graph.facebook.com/v21.0'

interface CrossPostInput {
  instagramPostId: string
  format: 'image' | 'carousel' | 'reel'
  caption: string
  productId: string | null
  photoUrls: string[]
  videoUrl: string | null
  siteUrl: string
}

async function graph<T>(path: string, token: string, fields?: Record<string, string>): Promise<T> {
  const response = await fetch(`${GRAPH}${path}`, {
    method: fields ? 'POST' : 'GET',
    ...(fields ? { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ...fields, access_token: token }) } : {}),
    signal: AbortSignal.timeout(120_000),
  })
  const body = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } }
  if (!response.ok || body.error) throw new Error(`Facebook API: ${body.error?.message ?? response.status}`)
  return body
}

export class FacebookService {
  constructor(private readonly pool: Pool) {}

  private config(): { pageId: string; token: string } | null {
    const pageId = process.env.FB_PAGE_ID?.trim()
    const token = process.env.FB_PAGE_ACCESS_TOKEN?.trim()
    return pageId && token ? { pageId, token } : null
  }

  async enabled(): Promise<boolean> {
    const result = await this.pool.query<{ value: string }>("select value from app_settings where key = 'fb_crosspost'")
    return result.rows[0]?.value === 'on'
  }

  async setEnabled(enabled: boolean) {
    await this.pool.query(
      `insert into app_settings(key, value, updated_at) values ('fb_crosspost', $1, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [enabled ? 'on' : 'off'],
    )
    return this.status()
  }

  async status() {
    const config = this.config()
    const enabled = await this.enabled()
    if (!config) return { configured: false as const, enabled }
    try {
      const page = await graph<{ id: string; name: string }>(`/${config.pageId}?fields=name&access_token=${encodeURIComponent(config.token)}`, config.token)
      return { configured: true as const, enabled, page: page.name }
    } catch (error) {
      return { configured: true as const, enabled, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async history(limit = 20) {
    const result = await this.pool.query(
      `select id::text, format, status, permalink, error, created_at from facebook_posts order by created_at desc limit $1`,
      [limit],
    )
    return result.rows
  }

  /** Best effort: returns null when it is off, not configured, or failed. */
  async crossPost(input: CrossPostInput): Promise<{ permalink: string } | null> {
    const config = this.config()
    if (!config || !(await this.enabled())) return null

    let slug: string | null = null
    if (input.productId) {
      const product = await this.pool.query<{ slug: string }>('select slug from products where id = $1', [input.productId])
      slug = product.rows[0]?.slug ?? null
    }
    const link = facebookLink(input.siteUrl, slug ? `/product/${slug}` : '/', 'autopilot')
    const caption = facebookCaption(input.caption, link)

    try {
      let fbId: string
      if (input.format === 'reel') {
        if (!input.videoUrl) throw new Error('no video to cross-post')
        fbId = (await graph<{ id: string }>(`/${config.pageId}/videos`, config.token, { file_url: input.videoUrl, description: caption })).id
      } else if (input.format === 'carousel') {
        const attached: Record<string, string> = {}
        for (const [i, url] of input.photoUrls.entries()) {
          const photo = await graph<{ id: string }>(`/${config.pageId}/photos`, config.token, { url, published: 'false' })
          attached[`attached_media[${i}]`] = JSON.stringify({ media_fbid: photo.id })
        }
        fbId = (await graph<{ id: string }>(`/${config.pageId}/feed`, config.token, { message: caption, ...attached })).id
      } else {
        const photo = await graph<{ id: string; post_id?: string }>(`/${config.pageId}/photos`, config.token, { url: input.photoUrls[0]!, caption })
        fbId = photo.post_id ?? photo.id
      }
      const permalink = `https://www.facebook.com/${fbId}`
      await this.log(input, 'published', fbId, permalink, null)
      return { permalink }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn('[facebook] cross-post failed:', message)
      await this.log(input, 'failed', null, null, message)
      return null
    }
  }

  private async log(input: CrossPostInput, status: 'published' | 'failed', fbId: string | null, permalink: string | null, error: string | null) {
    await this.pool
      .query(
        'insert into facebook_posts(instagram_post_id, format, caption, status, fb_id, permalink, error) values ($1, $2, $3, $4, $5, $6, $7)',
        [input.instagramPostId, input.format, input.caption, status, fbId, permalink, error?.slice(0, 1_000) ?? null],
      )
      .catch(() => {})
  }
}
