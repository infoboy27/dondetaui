import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FacebookService } from './facebook.service'

// A pool that answers the three queries the service makes.
function fakePool(enabled: boolean) {
  const queries: { sql: string; params?: unknown[] }[] = []
  return {
    queries,
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      queries.push({ sql, params })
      if (sql.includes("key = 'fb_crosspost'")) return { rows: enabled ? [{ value: 'on' }] : [] }
      if (sql.includes('select slug from products')) return { rows: [{ slug: 'nevera-samsung-1' }] }
      return { rows: [] }
    }),
  }
}

const input = (over = {}) => ({
  instagramPostId: 'ig-1', format: 'image' as const, productId: 'p1',
  caption: '💰 Ahorras\n🔎 Compara en x (link en la bio)\n#A #B #C #D',
  photoUrls: ['https://s.test/api/ig-media/ig-1.jpg'], videoUrl: null as string | null, siteUrl: 'https://co.dondeta.com.do', ...over,
})

describe('FacebookService.crossPost', () => {
  const calls: { url: string; body: URLSearchParams }[] = []

  beforeEach(() => {
    calls.length = 0
    process.env.FB_PAGE_ID = '123'
    process.env.FB_PAGE_ACCESS_TOKEN = 'tok'
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, body: init.body as URLSearchParams })
      return new Response(JSON.stringify({ id: `m${calls.length}`, post_id: '123_999' }), { status: 200 })
    }))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.FB_PAGE_ID
    delete process.env.FB_PAGE_ACCESS_TOKEN
  })

  it('does nothing while the switch is off or the Page is not configured', async () => {
    expect(await new FacebookService(fakePool(false) as never).crossPost(input())).toBeNull()
    delete process.env.FB_PAGE_ID
    expect(await new FacebookService(fakePool(true) as never).crossPost(input())).toBeNull()
    expect(calls).toHaveLength(0)
  })

  it('posts the card as a photo with a direct, tagged product link', async () => {
    const pool = fakePool(true)
    const result = await new FacebookService(pool as never).crossPost(input())
    expect(result?.permalink).toBe('https://www.facebook.com/123_999')
    expect(calls[0]!.url).toContain('/123/photos')
    expect(calls[0]!.body.get('url')).toBe('https://s.test/api/ig-media/ig-1.jpg')
    const caption = calls[0]!.body.get('caption')!
    expect(caption).toContain('https://co.dondeta.com.do/product/nevera-samsung-1?utm_source=facebook')
    expect(caption).not.toContain('link en la bio')
    expect(caption.endsWith('#A #B #C')).toBe(true)
    expect(pool.queries.some(q => q.sql.includes('insert into facebook_posts') && q.params?.[3] === 'published')).toBe(true)
  })

  it('posts a carousel as unpublished photos attached to one feed post, and a Reel as a video', async () => {
    await new FacebookService(fakePool(true) as never).crossPost(input({ format: 'carousel', photoUrls: ['https://s.test/a.jpg', 'https://s.test/b.jpg'] }))
    expect(calls.map(c => c.url.split('/v21.0')[1])).toEqual(['/123/photos', '/123/photos', '/123/feed'])
    expect(calls[0]!.body.get('published')).toBe('false')
    expect(calls[2]!.body.get('attached_media[1]')).toBe(JSON.stringify({ media_fbid: 'm2' }))

    calls.length = 0
    await new FacebookService(fakePool(true) as never).crossPost(input({ format: 'reel', videoUrl: 'https://s.test/r.mp4' }))
    expect(calls[0]!.url).toContain('/123/videos')
    expect(calls[0]!.body.get('file_url')).toBe('https://s.test/r.mp4')
  })

  it('logs a failure instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { message: 'token expired' } }), { status: 400 })))
    const pool = fakePool(true)
    expect(await new FacebookService(pool as never).crossPost(input())).toBeNull()
    expect(pool.queries.some(q => q.sql.includes('insert into facebook_posts') && q.params?.[3] === 'failed' && String(q.params?.[6]).includes('token expired'))).toBe(true)
  })
})
