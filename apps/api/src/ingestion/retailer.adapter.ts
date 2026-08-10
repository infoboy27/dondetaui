import type { NormalizedRetailerItem } from './ingestion.types'
import type { RetailerConfig } from './retailer.config'
import { fetchHtmlWithCookies } from './http-client'

function decodeHtml(value: string): string {
  return value.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim()
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
}

function first(html: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtml(match[1])
  }
  return undefined
}

function findProductJson(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProductJson(item)
      if (found) return found
    }
    return null
  }
  const object = value as Record<string, unknown>
  const type = object['@type']
  if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) return object
  for (const child of Object.values(object)) {
    const found = findProductJson(child)
    if (found) return found
  }
  return null
}

function extractJsonProduct(html: string): Record<string, unknown> | null {
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(html))) {
    try {
      const found = findProductJson(JSON.parse(match[1]))
      if (found) return found
    } catch { /* ignore malformed JSON-LD */ }
  }
  return null
}

function nestedString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const direct = (value as Record<string, unknown>)[key]
  if (typeof direct === 'string' || typeof direct === 'number') return String(direct)
  return undefined
}

function extractPrice(html: string, product: Record<string, unknown> | null): number {
  if (product) {
    const offers = product.offers
    const offer = Array.isArray(offers) ? offers[0] : offers
    const value = nestedString(offer, 'price') ?? nestedString(offer, 'lowPrice')
    if (value && Number.isFinite(Number(value))) return Number(value)
  }
  const meta = first(html, [
    /<meta[^>]+(?:property|itemprop)=["'](?:product:price:amount|price)["'][^>]+content=["']([0-9.,]+)["']/i,
    /<meta[^>]+content=["']([0-9.,]+)["'][^>]+(?:property|itemprop)=["'](?:product:price:amount|price)["']/i,
    /["'](?:finalPrice|salePrice|price)["']\s*:\s*["']?([0-9]+(?:\.[0-9]+)?)/i,
  ])
  if (meta) return Number(meta.replace(/,/g, ''))

  const text = stripTags(html)
  const prices = [...text.matchAll(/(?:RD\$|\$)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)/gi)]
    .map(match => Number(match[1].replace(/,/g, '')))
    .filter(value => Number.isFinite(value) && value > 0)
  if (!prices.length) throw new Error('Retailer parser: price not found')
  return Math.min(...prices)
}

function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'otros'
}

function inferCategory(url: string, config: RetailerConfig): { name: string; slug: string } {
  const segments = new URL(url).pathname.split('/').filter(Boolean)
  const generic = new Set(['es-do', 'supermercado', 'all-products', 'product', 'producto', 'p'])
  const candidate = segments.find(segment => !generic.has(segment.toLowerCase()) && !segment.endsWith('.html'))
  if (!candidate) return config.defaultCategory
  const name = decodeURIComponent(candidate).replace(/[-_]+/g, ' ').replace(/\b\w/g, value => value.toUpperCase())
  return { name, slug: slugify(name) }
}

function inferModel(name: string, html: string, product: Record<string, unknown> | null): string {
  const explicit = nestedString(product, 'model') ?? nestedString(product, 'sku') ?? first(html, [
    /\bModelo\s*(?:<[^>]+>|[:|\-\s])*\s*([A-Z0-9][A-Z0-9._\/-]{3,})/i,
    /\bArt\s*(?:<[^>]+>|[:|\-\s])*\s*([A-Z0-9][A-Z0-9._\/-]{3,})/i,
    /["'](?:model|sku)["']\s*:\s*["']([^"']+)["']/i,
  ])
  if (explicit && explicit.length <= 100) return explicit.trim()
  const token = name.match(/\b[A-Z]{1,6}[A-Z0-9._\/-]{3,}\d[A-Z0-9._\/-]*\b/g)?.at(-1)
  return token ?? slugify(name).slice(0, 80)
}

function inferBrand(name: string, html: string, product: Record<string, unknown> | null): string {
  const brandValue = product?.brand
  if (typeof brandValue === 'string' && brandValue.trim()) return brandValue.trim()
  if (brandValue && typeof brandValue === 'object') {
    const value = nestedString(brandValue, 'name')
    if (value) return value
  }
  const explicit = first(html, [/["']brand["']\s*:\s*["']([^"']+)["']/i, /\bMarca\s*(?:<[^>]+>|[:|\-\s])*\s*([A-Za-z0-9 &._-]{2,40})/i])
  if (explicit) return explicit.trim()
  return name.split(/\s+/)[0] || 'Desconocida'
}

function inferAvailability(html: string, product: Record<string, unknown> | null): boolean {
  const offers = product?.offers
  const offer = Array.isArray(offers) ? offers[0] : offers
  const availability = nestedString(offer, 'availability') ?? ''
  if (/OutOfStock|SoldOut/i.test(availability)) return false
  if (/InStock/i.test(availability)) return true
  const text = stripTags(html)
  return !/agotado|no disponible|out of stock/i.test(text)
}

export class RetailerHtmlAdapter {
  constructor(private readonly config: RetailerConfig) {}

  async fetchProduct(url: string): Promise<NormalizedRetailerItem> {
    const { html } = await fetchHtmlWithCookies(url, `DondeTaPriceIndexer/0.3 (${this.config.slug}; +https://dondeta.app)`)
    const product = extractJsonProduct(html)
    const name = nestedString(product, 'name') ?? first(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
      /<title[^>]*>([\s\S]*?)<\/title>/i,
    ])
    if (!name) throw new Error('Retailer parser: product name not found')
    const cleanName = stripTags(name).replace(/\s*[|–-]\s*(?:Jumbo|Sirena|Tiendas Corripio|PriceSmart).*$/i, '').trim()
    const price = extractPrice(html, product)
    const model = inferModel(cleanName, html, product)
    const brand = inferBrand(cleanName, html, product)
    const gtin = nestedString(product, 'gtin13') ?? nestedString(product, 'gtin12') ?? nestedString(product, 'gtin') ?? first(html, [/["'](?:gtin13|gtin12|gtin|ean|upc)["']\s*:\s*["'](\d{8,14})["']/i])
    const ean = gtin && gtin.length >= 12 ? gtin : undefined
    const upc = gtin && gtin.length === 12 ? gtin : undefined
    const imageValue = product?.image
    const imageUrl = typeof imageValue === 'string' ? imageValue : Array.isArray(imageValue) && typeof imageValue[0] === 'string' ? imageValue[0] : first(html, [/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i])
    const category = inferCategory(url, this.config)

    return {
      retailer: { name: this.config.name, slug: this.config.slug, abbr: this.config.abbr, primaryColor: this.config.primaryColor, websiteUrl: this.config.websiteUrl },
      externalSku: nestedString(product, 'sku') ?? ean ?? upc ?? model,
      sourceUrl: url,
      name: cleanName,
      brand,
      model,
      ean,
      upc,
      categoryName: category.name,
      categorySlug: category.slug,
      imageUrl,
      price,
      shippingPrice: 0,
      available: inferAvailability(html, product),
      raw: { source: `${this.config.slug}-html`, fetchedAt: new Date().toISOString(), url, name: cleanName, brand, model, ean, upc, price },
    }
  }
}
