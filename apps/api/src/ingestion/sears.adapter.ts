import type { NormalizedRetailerItem } from './ingestion.types'
import type { SearsConfig } from './sears.config'

interface SearsHit {
  objectID: string
  sku?: string
  ean?: string
  title?: string
  brand?: string
  price?: number
  sale_price?: number
  stock?: number
  is_active?: boolean
  hirerarchical_category?: { lvl2?: string[]; lvl0?: string[] }
  photos?: { source?: string }[]
}

interface SearsQueryResponse {
  hits: SearsHit[]
  nbHits: number
  nbPages: number
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
  return stripDiacritics(value.normalize('NFD')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'producto'
}

function mostSpecificCategory(hit: SearsHit): { name: string; slug: string } {
  const path = hit.hirerarchical_category?.lvl2?.[0] ?? hit.hirerarchical_category?.lvl0?.[0]
  const name = path?.split('>').at(-1)?.trim()
  return name ? { name, slug: slugify(name) } : { name: 'Electrodomésticos', slug: 'electrodomesticos' }
}

export class SearsAdapter {
  constructor(private readonly config: SearsConfig) {}

  async fetchPage(page: number, hitsPerPage: number): Promise<SearsQueryResponse> {
    const url = `https://${this.config.appId.toLowerCase()}-dsn.algolia.net/1/indexes/${this.config.indexName}/query`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': this.config.apiKey,
        'X-Algolia-Application-Id': this.config.appId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: '', filters: this.config.categoryFilter, page, hitsPerPage }),
    })
    if (!response.ok) {
      throw new Error(`Sears: Algolia query failed (${response.status})`)
    }
    return response.json() as Promise<SearsQueryResponse>
  }

  normalize(hit: SearsHit): NormalizedRetailerItem | null {
    if (!hit.title) return null
    // sale_price is the current discounted price when set; price alone
    // (no active discount) is otherwise the asking price.
    const price = hit.sale_price && hit.sale_price > 0 && hit.sale_price < (hit.price ?? Infinity) ? hit.sale_price : hit.price
    if (!price || price <= 0) return null

    const category = mostSpecificCategory(hit)
    const ean = hit.ean && hit.ean.length >= 12 ? hit.ean : undefined

    return {
      retailer: {
        name: 'Sears', slug: 'sears-mx', abbr: 'SR', primaryColor: '#003DA5', websiteUrl: this.config.websiteUrl,
      },
      externalSku: hit.sku ?? hit.objectID,
      sourceUrl: `${this.config.websiteUrl}/producto/${hit.objectID}/${slugify(hit.title)}/`,
      name: hit.title,
      brand: hit.brand?.trim() || hit.title.split(/\s+/)[0] || 'Desconocida',
      model: hit.sku ?? hit.objectID,
      ean,
      categoryName: category.name,
      categorySlug: category.slug,
      imageUrl: hit.photos?.[0]?.source,
      price,
      shippingPrice: 0,
      available: Boolean(hit.is_active) && (hit.stock ?? 0) > 0,
      raw: { source: 'sears-mx-algolia-api', fetchedAt: new Date().toISOString(), objectID: hit.objectID },
    }
  }
}
