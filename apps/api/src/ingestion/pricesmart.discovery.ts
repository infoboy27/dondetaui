import type { Page } from 'playwright'

const PRICESMART_ORIGIN = 'https://www.pricesmart.com'
// "Línea Blanca" (major appliances: fridges, stoves, washers, microwaves, ACs) is the
// DR retail term used site-wide here — same department the rest of the config already
// targets. Both prefixes are needed: /es-do/linea-blanca is the paginated top-level
// listing, /es-do/categoria/Linea-blanca-* are its named subcategories.
const LINEA_BLANCA_PREFIX = '/es-do/linea-blanca'
const CATEGORIA_PREFIX = '/es-do/categoria/linea-blanca'
const PRODUCT_PREFIX = '/es-do/producto/'
const DEFAULT_SEEDS = [`${PRICESMART_ORIGIN}${LINEA_BLANCA_PREFIX}`]

export interface PriceSmartDiscoveryOptions {
  seedUrls?: string[]
  maxCategoryPages?: number
  maxProducts?: number
  requestDelayMs?: number
}

export interface PriceSmartDiscoveryResult {
  productUrls: string[]
  categoryPagesVisited: number
  categoryPagesDiscovered: number
}

function normalizeUrl(href: string, baseUrl: string): string | null {
  try {
    const url = new URL(href.trim(), baseUrl)
    if (url.origin !== PRICESMART_ORIGIN) return null
    url.hash = ''
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      url.searchParams.delete(key)
    }
    return url.toString()
  } catch {
    return null
  }
}

export function isCategoryUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.origin !== PRICESMART_ORIGIN) return false
    const path = url.pathname.toLowerCase()
    return path.startsWith(LINEA_BLANCA_PREFIX) || path.startsWith(CATEGORIA_PREFIX)
  } catch {
    return false
  }
}

export function isLikelyProductUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.origin === PRICESMART_ORIGIN && url.pathname.toLowerCase().startsWith(PRODUCT_PREFIX)
  } catch {
    return false
  }
}

async function delay(ms: number) {
  if (ms <= 0) return
  await new Promise(resolve => setTimeout(resolve, ms))
}

// PriceSmart is a Nuxt app: the initial HTML/`__NUXT__` state carries no product data at
// all (title reads "Loading..." until hydration), the catalog and PDP content are fetched
// client-side after mount. A plain fetch() would only ever see the empty shell — render
// with a real browser page and read the DOM after it settles, same approach as Plaza Lama.
async function renderHtml(page: Page, url: string): Promise<string> {
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
  if (response && !response.ok()) {
    throw new Error(`PriceSmart discovery request failed (${response.status()}) for ${url}`)
  }
  return page.content()
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

// The storefront lists categories through its own Bloomreach search proxy; the
// rendered listing only ever shows the first 12 products. Asking the proxy by
// category id returns the whole category in one call. Línea blanca alone is only
// ~50 products in the DR, so small appliances and TVs are included too.
const SEARCH_API = `${PRICESMART_ORIGIN}/api/br_discovery/getProductsByKeyword`
const API_CATEGORIES = ['M10D43', 'S20D23', 'E10D24015'] // Línea blanca, Electrodomésticos, Televisores
const API_PAGE_SIZE = 200

interface SearchDoc {
  pid?: string
  slug?: string
  availability_DO?: string | boolean
}

export function productUrlFromDoc(doc: SearchDoc): string | null {
  if (!doc.pid || !doc.slug) return null
  return `${PRICESMART_ORIGIN}${PRODUCT_PREFIX}${encodeURIComponent(doc.slug)}/${encodeURIComponent(doc.pid)}`
}

async function searchCategory(category: string, start: number): Promise<{ numFound: number; docs: SearchDoc[] }> {
  const response = await fetch(SEARCH_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'DondeTaPriceIndexer/0.3 (+https://dondeta.app)' },
    body: JSON.stringify([{
      url: `${PRICESMART_ORIGIN}/es-do/`,
      start,
      q: category,
      fq: [],
      search_type: 'category',
      rows: API_PAGE_SIZE,
      account_id: '7024',
      auth_key: 'ev7libhybjg5h1d1',
      request_id: Date.now(),
      domain_key: 'pricesmart_bloomreach_io_es',
      fl: 'pid,slug,availability_DO',
      view_id: 'DO',
    }]),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`PriceSmart search API failed (${response.status}) for ${category}`)
  const body = await response.json() as { response?: { numFound?: number; docs?: SearchDoc[] } }
  return { numFound: body.response?.numFound ?? 0, docs: body.response?.docs ?? [] }
}

export class PriceSmartCatalogDiscovery {
  constructor(private readonly page: Page) {}

  async discover(options: PriceSmartDiscoveryOptions = {}): Promise<PriceSmartDiscoveryResult> {
    if (!options.seedUrls?.length) {
      try {
        const result = await this.discoverViaApi(options)
        if (result.productUrls.length) return result
        console.warn('[pricesmart] search API returned no products; falling back to rendered listing')
      } catch (error) {
        console.warn(`[pricesmart] search API failed, falling back to rendered listing: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    return this.discoverRendered(options)
  }

  private async discoverViaApi(options: PriceSmartDiscoveryOptions): Promise<PriceSmartDiscoveryResult> {
    const maxProducts = Math.max(1, options.maxProducts ?? 5_000)
    const productUrls = new Set<string>()
    let calls = 0
    for (const category of API_CATEGORIES) {
      for (let start = 0; productUrls.size < maxProducts; start += API_PAGE_SIZE) {
        const { numFound, docs } = await searchCategory(category, start)
        calls += 1
        for (const doc of docs) {
          if (String(doc.availability_DO) === 'false') continue
          const url = productUrlFromDoc(doc)
          if (url) productUrls.add(url)
        }
        if (!docs.length || start + API_PAGE_SIZE >= numFound) break
      }
    }
    return { productUrls: [...productUrls].slice(0, maxProducts), categoryPagesVisited: calls, categoryPagesDiscovered: API_CATEGORIES.length }
  }

  private async discoverRendered(options: PriceSmartDiscoveryOptions): Promise<PriceSmartDiscoveryResult> {
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
        console.warn(`[pricesmart] discovery skipped ${url}: ${error instanceof Error ? error.message : String(error)}`)
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
