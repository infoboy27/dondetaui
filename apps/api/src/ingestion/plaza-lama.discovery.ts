import type { Page } from 'playwright'

const PLAZA_LAMA_ORIGIN = 'https://plazalama.com.do'
// DóndeTa only covers electrodomésticos (appliances). Deliberately NOT seeding from
// /oldHome — its site-wide nav walks the crawler into every department (supermercado,
// ferretería, hogar, moda...), which is how batteries/toilets/chocolate ended up
// ingested. Scope enforced again in isCategoryUrl below, in case a category page's
// own nav links elsewhere too.
const ELECTRODOMESTICOS_PREFIX = '/ca/electrodomesticos'
// The appliance subcategories (Tecnología / Equipos Comerciales left out on
// purpose). Each one is paginated with ?currentPage=N -- the page count comes
// from the antd pager ("1/3"); ?page=N is silently ignored by the site.
const DEFAULT_SEEDS = [
  'lavado/4/4-7',
  'televisores-y-video/4/4-11',
  'refrigeracion/4/4-9',
  'climatizacion/4/4-4',
  'cocina/4/4-5',
  'pequenos-electrodomesticos/4/4-8',
  'audio/4/4-3',
].map(path => `${PLAZA_LAMA_ORIGIN}${ELECTRODOMESTICOS_PREFIX}/${path}`)
const MAX_PAGES_PER_CATEGORY = 40

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

function pageUrl(categoryUrl: string, page: number): string {
  const url = new URL(categoryUrl)
  if (page > 1) url.searchParams.set('currentPage', String(page))
  else url.searchParams.delete('currentPage')
  return url.toString()
}

export class PlazaLamaCatalogDiscovery {
  constructor(private readonly page: Page) {}

  // Total pages from the antd "simple" pager, whose title reads "1/3".
  private async pageCount(): Promise<number> {
    const title = await this.page
      .$eval('.ant-pagination-simple-pager', el => el.getAttribute('title'))
      .catch(() => null)
    const total = Number(title?.split('/')[1])
    return Number.isFinite(total) && total > 0 ? Math.min(total, MAX_PAGES_PER_CATEGORY) : 1
  }

  async discover(options: PlazaLamaDiscoveryOptions = {}): Promise<PlazaLamaDiscoveryResult> {
    const maxCategoryPages = Math.max(1, options.maxCategoryPages ?? 150)
    const maxProducts = Math.max(1, options.maxProducts ?? 5_000)
    const requestDelayMs = Math.max(0, options.requestDelayMs ?? 500)
    const seeds = options.seedUrls?.length ? options.seedUrls : DEFAULT_SEEDS
    const productUrls = new Set<string>()
    let visited = 0

    for (const seed of seeds) {
      let pages = 1
      for (let n = 1; n <= pages; n++) {
        if (visited >= maxCategoryPages || productUrls.size >= maxProducts) break
        const url = pageUrl(seed, n)
        visited += 1
        try {
          const html = await renderHtml(this.page, url)
          if (n === 1) pages = await this.pageCount()
          for (const link of extractLinks(html, url)) {
            if (isLikelyProductUrl(link)) productUrls.add(link)
          }
        } catch (error) {
          console.warn(`[plaza-lama] discovery skipped ${url}: ${error instanceof Error ? error.message : String(error)}`)
        }
        await delay(requestDelayMs)
      }
    }

    return {
      productUrls: [...productUrls].slice(0, maxProducts),
      categoryPagesVisited: visited,
      categoryPagesDiscovered: visited,
    }
  }
}
