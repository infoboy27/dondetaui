import type { Page } from 'playwright'
import type { NormalizedRetailerItem } from './ingestion.types'

const KNOWN_BRANDS = [
  'Samsung',
  'LG',
  'Tecnomaster',
  'Frigidaire',
  'Daiwa',
  'Sharp',
  'Drija',
  'Dimensions',
  'Sensibo',
  'Whirlpool',
  'Mabe',
  'Oster',
  'Black+Decker',
  'Hamilton Beach',
]

function decodeHtml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' '))
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'otros'
}

function firstMatch(html: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtml(match[1])
  }
  return undefined
}

interface PlazaLamaProductJsonLd {
  raw: string
  data: {
    name?: string
    sku?: string
    image?: string | string[]
    brand?: { name?: string } | string
    offers?: {
      priceSpecification?: { price?: number }
      price?: number | string
      availability?: string
    }
  }
}

// Product pages carry a standard schema.org JSON-LD block with the canonical data —
// far more reliable than regex-scanning the whole rendered page, which also contains
// JSON-LD/data blobs for unrelated cards (related products, category listings) that
// can false-match generic keys like "model" or "brand".
function extractProductJsonLd(html: string): PlazaLamaProductJsonLd | null {
  const scripts = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const match of scripts) {
    const raw = match[1]
    try {
      const data = JSON.parse(raw)
      if (data && data['@type'] === 'Product') return { raw, data }
    } catch {
      continue
    }
  }
  return null
}

function extractName(html: string): string {
  const value = firstMatch(html, [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  ])
  if (!value) throw new Error('Plaza Lama parser: product name not found')
  return stripTags(value).replace(/\s*\|\s*Plaza Lama.*$/i, '').trim()
}

function extractPrice(html: string): number {
  const jsonPrice = firstMatch(html, [
    /["']price["']\s*:\s*["']?([0-9]+(?:\.[0-9]+)?)/i,
    /["']salePrice["']\s*:\s*["']?([0-9]+(?:\.[0-9]+)?)/i,
  ])
  if (jsonPrice) return Number(jsonPrice)

  const visible = html.match(/\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)/)
  if (!visible?.[1]) throw new Error('Plaza Lama parser: product price not found')
  return Number(visible[1].replace(/,/g, ''))
}

function extractImage(html: string): string | undefined {
  return firstMatch(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ])
}

function extractEan(url: string, html: string): string | undefined {
  const fromUrl = url.match(/(?:-|\/)(\d{12,14})(?:\/?(?:\?.*)?)$/)?.[1]
  if (fromUrl) return fromUrl

  return firstMatch(html, [
    /["'](?:ean|gtin13|gtin)["']\s*:\s*["'](\d{12,14})["']/i,
  ])
}

function extractBrand(name: string, html: string): string {
  const explicit = firstMatch(html, [
    // schema.org JSON-LD nests brand as an object: "brand":{"@type":"Brand","name":"X"}
    /["']brand["']\s*:\s*\{[^}]*["']name["']\s*:\s*["']([^"']+)["']/i,
    /["']brand["']\s*:\s*["']([^"']+)["']/i,
  ])
  if (explicit && explicit.length <= 40) return explicit.trim()

  const known = KNOWN_BRANDS.find(brand => new RegExp(`\\b${brand.replace('+', '\\+')}\\b`, 'i').test(name))
  return known ?? 'Desconocida'
}

function extractModel(name: string, html: string, ean?: string): string {
  const explicit = firstMatch(html, [
    /["']model["']\s*:\s*["']([^"']+)["']/i,
    /\bM\/\s*([A-Z0-9][A-Z0-9._-]{3,})/i,
  ])
  if (explicit && explicit.length <= 80) return explicit.trim()

  const tokens = name.match(/\b[A-Z]{1,5}[A-Z0-9-]{3,}\d[A-Z0-9-]*\b/g)
  return tokens?.at(-1) ?? ean ?? name.slice(0, 80)
}

function extractCategory(html: string): { name: string; slug: string } {
  const jsonLdNames = [...html.matchAll(/["']name["']\s*:\s*["']([^"']+)["']/gi)]
    .map(match => decodeHtml(match[1]))
    .filter(value => value.length > 1 && value.length < 80)

  const productIndex = jsonLdNames.findIndex(value => /producto|product/i.test(value))
  if (productIndex > 0) {
    const candidate = jsonLdNames[productIndex - 1]
    return { name: candidate, slug: slugify(candidate) }
  }

  const breadcrumb = firstMatch(html, [
    /<nav[^>]+(?:breadcrumb|migas)[^>]*>([\s\S]*?)<\/nav>/i,
    /<ol[^>]+(?:breadcrumb|migas)[^>]*>([\s\S]*?)<\/ol>/i,
  ])

  if (breadcrumb) {
    const labels = [...breadcrumb.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)]
      .map(match => stripTags(match[1]))
      .filter(label => label && !/inicio|home|plaza lama/i.test(label))

    const candidate = labels.at(-1)
    if (candidate) return { name: candidate, slug: slugify(candidate) }
  }

  return { name: 'Otros', slug: 'otros' }
}

function extractAvailability(html: string): boolean {
  if (/https?:\/\/schema\.org\/OutOfStock/i.test(html)) return false
  if (/https?:\/\/schema\.org\/InStock/i.test(html)) return true
  if (/\bNo disponible\b/i.test(stripTags(html))) return false
  return true
}

export class PlazaLamaAdapter {
  constructor(private readonly page: Page) {}

  async fetchProduct(url: string): Promise<NormalizedRetailerItem> {
    // Plaza Lama's product data (JSON-LD, og:* meta, price) is injected client-side by
    // Next.js — a plain fetch() only sees the pre-hydration shell. Render with a real
    // browser page and read the DOM after it settles, same as catalog discovery.
    const response = await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
    if (response && !response.ok()) {
      throw new Error(`Plaza Lama request failed (${response.status()}) for ${url}`)
    }

    const html = await this.page.content()
    const productLd = extractProductJsonLd(html)
    // Scope the regex fallbacks to this product's own JSON-LD text (small, unambiguous)
    // instead of the whole page, so they can't cross-match a different product's card.
    const scopedHtml = productLd?.raw ?? html

    const name = productLd?.data.name ? decodeHtml(productLd.data.name) : extractName(html)
    const price = productLd?.data.offers?.priceSpecification?.price
      ?? (productLd?.data.offers?.price ? Number(productLd.data.offers.price) : undefined)
      ?? extractPrice(html)
    const ean = extractEan(url, scopedHtml) ?? (productLd?.data.sku && /^\d{8,14}$/.test(productLd.data.sku) ? productLd.data.sku : undefined)
    const brandName = typeof productLd?.data.brand === 'object' ? productLd.data.brand?.name : productLd?.data.brand
    const brand = brandName?.trim() || extractBrand(name, scopedHtml)
    const model = extractModel(name, scopedHtml, ean)
    const available = productLd?.data.offers?.availability
      ? /InStock/i.test(productLd.data.offers.availability)
      : extractAvailability(html)
    const category = extractCategory(html)
    const jsonLdImage = Array.isArray(productLd?.data.image) ? productLd.data.image[0] : productLd?.data.image

    return {
      retailer: {
        name: 'Plaza Lama',
        slug: 'plaza-lama',
        abbr: 'PL',
        primaryColor: '#C0392B',
        websiteUrl: 'https://plazalama.com.do',
      },
      externalSku: ean ?? model,
      sourceUrl: url,
      name,
      brand,
      model,
      ean,
      categoryName: category.name,
      categorySlug: category.slug,
      imageUrl: jsonLdImage ?? extractImage(html),
      price,
      shippingPrice: 0,
      available,
      raw: {
        source: 'plaza-lama-html',
        fetchedAt: new Date().toISOString(),
        url,
        name,
        brand,
        model,
        ean,
        price,
        available,
        category: category.name,
      },
    }
  }
}
