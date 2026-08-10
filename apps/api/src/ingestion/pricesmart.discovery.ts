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

export class PriceSmartCatalogDiscovery {
  constructor(private readonly page: Page) {}

  async discover(options: PriceSmartDiscoveryOptions = {}): Promise<PriceSmartDiscoveryResult> {
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
