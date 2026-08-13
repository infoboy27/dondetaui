import type { NormalizedRetailerItem } from './ingestion.types'
import type { FalabellaConfig, FalabellaSearchTerm } from './falabella.config'

interface FalabellaPrice {
  type: string
  crossed: boolean
  price: string[]
}

interface FalabellaResult {
  productId: string
  displayName?: string
  brand?: string
  url?: string
  mediaUrls?: string[]
  prices?: FalabellaPrice[]
}

interface FalabellaPageProps {
  results: FalabellaResult[]
  pagination?: { count: number; perPage: number; currentPage: number }
}

// Prefers a public, non-card-specific asking price (internetPrice/
// eventPrice) over the crossed-out original price or the CMR store-card
// price (only available to Falabella cardholders, not a fair "the price").
function pickPrice(prices: FalabellaPrice[] | undefined): number | null {
  if (!prices?.length) return null
  const publicPrice = prices.find(p => !p.crossed && p.type !== 'cmrPrice')
  const fallback = prices.find(p => !p.crossed)
  const raw = (publicPrice ?? fallback)?.price?.[0]
  if (!raw) return null
  const digits = raw.replace(/[^\d]/g, '')
  const value = Number(digits)
  return value > 0 ? value : null
}

// Strips NFD-decomposed combining diacritical marks by codepoint
// comparison -- see vtex-api.adapter.ts for why this avoids a regex
// unicode-range literal.
function stripDiacritics(value: string): string {
  return [...value].filter(char => {
    const code = char.codePointAt(0) ?? 0
    return code < 0x300 || code > 0x36f
  }).join('')
}

function slugify(value: string): string {
  return stripDiacritics(value.normalize('NFD')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'otros'
}

export class FalabellaAdapter {
  constructor(private readonly config: FalabellaConfig) {}

  // Falabella server-renders results into a __NEXT_DATA__ script tag on
  // the initial HTML response -- no separate product API call exists (the
  // page itself doesn't make one; see falabella.config.ts).
  async fetchPage(term: FalabellaSearchTerm, page: number): Promise<FalabellaPageProps> {
    const url = `${this.config.websiteUrl}/${this.config.countryPath}/search?Ntt=${encodeURIComponent(term.query)}&page=${page}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': `DondeTaPriceIndexer/0.3 (${this.config.slug}; +https://dondeta.app)`,
      },
    })
    if (!response.ok) {
      throw new Error(`${this.config.name}: search failed (${response.status}) for "${term.query}"`)
    }
    const html = await response.text()
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)
    if (!match) throw new Error(`${this.config.name}: __NEXT_DATA__ not found for "${term.query}"`)
    const data = JSON.parse(match[1]) as { props?: { pageProps?: FalabellaPageProps } }
    const pageProps = data.props?.pageProps
    if (!pageProps?.results) throw new Error(`${this.config.name}: no results in page data for "${term.query}"`)
    return pageProps
  }

  normalize(result: FalabellaResult, term: FalabellaSearchTerm): NormalizedRetailerItem | null {
    if (!result.displayName || !result.url) return null
    const price = pickPrice(result.prices)
    if (!price) return null

    return {
      retailer: {
        name: this.config.name, slug: this.config.slug, abbr: this.config.abbr,
        primaryColor: this.config.primaryColor, websiteUrl: this.config.websiteUrl,
      },
      externalSku: result.productId,
      sourceUrl: result.url,
      name: result.displayName,
      brand: result.brand?.trim() || result.displayName.split(/\s+/)[0] || 'Desconocida',
      model: result.productId,
      categoryName: term.categoryName,
      categorySlug: term.categorySlug || slugify(term.categoryName),
      imageUrl: result.mediaUrls?.[0],
      price,
      shippingPrice: 0,
      // No explicit stock flag in the search response -- items that stop
      // being sellable drop out of search results entirely, so anything
      // returned here is treated as available.
      available: true,
      raw: { source: `${this.config.slug}-nextdata`, fetchedAt: new Date().toISOString(), searchTerm: term.query },
    }
  }
}
