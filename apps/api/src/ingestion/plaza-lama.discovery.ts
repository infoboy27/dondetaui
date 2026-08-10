import type { Page } from 'playwright'

const PLAZA_LAMA_ORIGIN = 'https://plazalama.com.do'
// DóndeTa only covers electrodomésticos (appliances). Deliberately NOT seeding from
// /oldHome — its site-wide nav walks the crawler into every department (supermercado,
// ferretería, hogar, moda...), which is how batteries/toilets/chocolate ended up
// ingested. Scope enforced again in isCategoryUrl below, in case a category page's
// own nav links elsewhere too.
const ELECTRODOMESTICOS_PREFIX = '/ca/electrodomesticos'
const DEFAULT_SEEDS = [`${PLAZA_LAMA_ORIGIN}${ELECTRODOMESTICOS_PREFIX}/4`]

export interface PlazaLamaDiscoveryOptions {
  seedUrls?: string[]
  maxCategoryPages?: number
  maxProducts?: number
  requestDelayMs?: number
}

export interface PlazaLamaDiscoveryResult {
  productUrls: string[]
  categoryPagesVisited: number
  categoryPagesDiscovered: number
}

function decodeHref(value: string): string {
  return value.replace(/&amp;/gi, '&').trim()
}

function normalizeUrl(href: string, baseUrl: string): string | null {
  try {
    const url = new URL(decodeHref(href), baseUrl)
    if (url.origin !== PLAZA_LAMA_ORIGIN) return null
    url.hash = ''
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      url.searchParams.delete(key)
    }
    return url.toString()
  } catch {
    return null
  }
}

export function extractLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>()
  const pattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html))) {
    const normalized = normalizeUrl(match[1], baseUrl)
    if (normalized) links.add(normalized)
  }

  return [...links]
}

export function isCategoryUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.origin === PLAZA_LAMA_ORIGIN && url.pathname.toLowerCase().startsWith(ELECTRODOMESTICOS_PREFIX)
  } catch {
    return false
  }
}

export function isLikelyProductUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.origin !== PLAZA_LAMA_ORIGIN) return false

    const path = url.pathname.toLowerCase()
    if (
      path === '/' ||
      path.startsWith('/ca/') ||
      path.startsWith('/search') ||
      path.startsWith('/login') ||
      path.startsWith('/account') ||
      path.startsWith('/cart') ||
      path.startsWith('/checkout') ||
      path.startsWith('/oldhome') ||
      path.startsWith('/static/') ||
      path.startsWith('/assets/')
    ) {
      return false
    }

    if (/\/(?:p|product|products|producto|productos)\//i.test(path)) return true

    const segments = path.split('/').filter(Boolean)
    const last = segments.at(-1) ?? ''
    const hasSkuLikeTail = /(?:^|[-_])\d{5,14}$/.test(last) || /^\d{8,14}$/.test(last)
    const hasSlugShape = segments.length >= 2 && last.length >= 12 && last.includes('-')

    return hasSkuLikeTail || hasSlugShape
  } catch {
    return false
  }
}

async function delay(ms: number) {
  if (ms <= 0) return
  await new Promise(resolve => setTimeout(resolve, ms))
}

// Plaza Lama's catalog is a Next.js app that renders client-side — a plain fetch()
// only gets the pre-hydration shell (no product links at all). Render it with a real
// browser page instead and read the DOM after it settles.
async function renderHtml(page: Page, url: string): Promise<string> {
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
  if (response && !response.ok()) {
    throw new Error(`Plaza Lama discovery request failed (${response.status()}) for ${url}`)
  }
  return page.content()
}

export class PlazaLamaCatalogDiscovery {
  constructor(private readonly page: Page) {}

  async discover(options: PlazaLamaDiscoveryOptions = {}): Promise<PlazaLamaDiscoveryResult> {
    const maxCategoryPages = Math.max(1, options.maxCategoryPages ?? 150)
    const maxProducts = Math.max(1, options.maxProducts ?? 5_000)
    const requestDelayMs = Math.max(0, options.requestDelayMs ?? 500)
    const queue = [...(options.seedUrls?.length ? options.seedUrls : DEFAULT_SEEDS)]
    const queued = new Set(queue)
    const visited = new Set<string>()
    const productUrls = new Set<string>()

    while (queue.length && visited.size < maxCategoryPages && productUrls.size < maxProducts) {
      const url = queue.shift()!
      if (visited.has(url)) continue
      visited.add(url)

      try {
        const html = await renderHtml(this.page, url)
        for (const link of extractLinks(html, url)) {
          if (isLikelyProductUrl(link)) {
            productUrls.add(link)
            if (productUrls.size >= maxProducts) break
            continue
          }

          if (isCategoryUrl(link) && !visited.has(link) && !queued.has(link)) {
            queue.push(link)
            queued.add(link)
          }
        }
      } catch (error) {
        console.warn(`[plaza-lama] discovery skipped ${url}: ${error instanceof Error ? error.message : String(error)}`)
      }

      if (queue.length && productUrls.size < maxProducts) {
        await delay(requestDelayMs)
      }
    }

    return {
      productUrls: [...productUrls],
      categoryPagesVisited: visited.size,
      categoryPagesDiscovered: queued.size,
    }
  }
}
