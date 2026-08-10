import type { RetailerConfig } from './retailer.config'
import { fetchHtmlWithCookies } from './http-client'

export interface DiscoveryOptions {
  maxPages?: number
  maxProducts?: number
  requestDelayMs?: number
}

export interface DiscoveryResult {
  productUrls: string[]
  pagesVisited: number
  pagesDiscovered: number
}

function sleep(ms: number) {
  return ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve()
}

function normalizeUrl(href: string, baseUrl: string, config: RetailerConfig): string | null {
  try {
    const url = new URL(href.replace(/&amp;/gi, '&').trim(), baseUrl)
    const allowedHost = new URL(config.origin).hostname.replace(/^www\./, '')
    if (url.hostname.replace(/^www\./, '') !== allowedHost) return null
    url.hash = ''
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid']) {
      url.searchParams.delete(key)
    }
    return url.toString()
  } catch {
    return null
  }
}

export function extractRetailerLinks(html: string, baseUrl: string, config: RetailerConfig): string[] {
  const links = new Set<string>()
  const pattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(html))) {
    const normalized = normalizeUrl(match[1], baseUrl, config)
    if (normalized) links.add(normalized)
  }
  return [...links]
}

function pathname(value: string) {
  try { return new URL(value).pathname.toLowerCase() } catch { return '' }
}

export function isExcludedUrl(value: string, config: RetailerConfig): boolean {
  const path = pathname(value)
  return config.excludedPrefixes.some(prefix => path.startsWith(prefix.toLowerCase()))
}

export function isCrawlUrl(value: string, config: RetailerConfig): boolean {
  if (isExcludedUrl(value, config)) return false
  const path = pathname(value)
  return config.crawlPrefixes.some(prefix => path.startsWith(prefix.toLowerCase()))
}

export function isLikelyRetailerProductUrl(value: string, config: RetailerConfig): boolean {
  if (isExcludedUrl(value, config)) return false
  const path = pathname(value)
  if (!path || path === '/' || path === '/es-do' || path.endsWith('/all-products')) return false
  if (config.productPatterns.some(pattern => pattern.test(path))) return true
  if (config.productPatterns.length > 0) return false

  // Fallback for storefronts with no configured productPatterns at all, whose product
  // URLs are plain slugs. The product parser is still the final gate before
  // persistence, so a false positive is safely discarded. Once a retailer has any
  // explicit productPatterns, treat them as authoritative rather than also running this
  // generic heuristic — sitewide nav/category slugs (e.g. Jumbo's deeply nested
  // /hogar/cocina-sl-5652 or /supermercado/bebe/alimentacion-de-bebe) can coincidentally
  // look SKU-like or "deep" too, and a retailer with real patterns configured should
  // rely on those instead of a heuristic tuned for sites that have none.
  const segments = path.split('/').filter(Boolean)
  const last = segments.at(-1) ?? ''
  const looksLikeSku = /(?:^|[-_])[a-z]{0,5}\d{4,}[a-z0-9_-]*$/i.test(last)
  const deepSlug = segments.length >= 2 && last.length >= 14 && /[-_]/.test(last)
  return looksLikeSku || deepSlug
}

async function fetchHtml(url: string, config: RetailerConfig): Promise<string> {
  try {
    const { html } = await fetchHtmlWithCookies(url, `DondeTaPriceIndexer/0.3 (${config.slug}; +https://dondeta.app)`)
    return html
  } catch (error) {
    throw new Error(`${config.name} discovery request failed for ${url}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export class RetailerCatalogDiscovery {
  constructor(private readonly config: RetailerConfig) {}

  async discover(options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
    const maxPages = Math.max(1, options.maxPages ?? 150)
    const maxProducts = Math.max(1, options.maxProducts ?? 5_000)
    const requestDelayMs = Math.max(0, options.requestDelayMs ?? 500)
    const queue = [...this.config.seedUrls]
    const queued = new Set(queue)
    const visited = new Set<string>()
    const products = new Set<string>()

    while (queue.length && visited.size < maxPages && products.size < maxProducts) {
      const url = queue.shift()!
      if (visited.has(url)) continue
      visited.add(url)

      try {
        const html = await fetchHtml(url, this.config)
        for (const link of extractRetailerLinks(html, url, this.config)) {
          if (isLikelyRetailerProductUrl(link, this.config)) {
            products.add(link)
            if (products.size >= maxProducts) break
          }
          if (isCrawlUrl(link, this.config) && !visited.has(link) && !queued.has(link)) {
            queue.push(link)
            queued.add(link)
          }
        }
      } catch (error) {
        console.warn(`[${this.config.slug}] discovery skipped ${url}: ${error instanceof Error ? error.message : String(error)}`)
      }

      if (queue.length && products.size < maxProducts) await sleep(requestDelayMs)
    }

    return { productUrls: [...products], pagesVisited: visited.size, pagesDiscovered: queued.size }
  }
}
