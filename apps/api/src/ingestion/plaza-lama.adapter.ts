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
  const explicit = firstMatch(html, [/["']brand["']\s*:\s*["']([^"']+)["']/i])
  if (explicit && explicit.length <= 40) return explicit

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
  async fetchProduct(url: string): Promise<NormalizedRetailerItem> {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'DondeTaPriceIndexer/0.2 (+https://dondeta.app)',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      throw new Error(`Plaza Lama request failed (${response.status}) for ${url}`)
    }

    const html = await response.text()
    const name = extractName(html)
    const price = extractPrice(html)
    const ean = extractEan(url, html)
    const brand = extractBrand(name, html)
    const model = extractModel(name, html, ean)
    const available = extractAvailability(html)
    const category = extractCategory(html)

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
      imageUrl: extractImage(html),
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
