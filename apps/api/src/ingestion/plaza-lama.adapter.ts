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

  const known = KNOWN_BRANDS.find(brand => new RegExp(`\\b${brand}\\b`, 'i').test(name))
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

export class PlazaLamaAdapter {
  async fetchProduct(url: string): Promise<NormalizedRetailerItem> {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'DondeTaPriceIndexer/0.1 (+https://dondeta.app)',
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
    const available = !/No disponible/i.test(stripTags(html))

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
      categoryName: 'Electrodomésticos',
      categorySlug: 'electrodomesticos',
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
      },
    }
  }
}
