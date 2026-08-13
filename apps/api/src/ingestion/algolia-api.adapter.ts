import type { NormalizedRetailerItem } from './ingestion.types'
import type { AlgoliaRetailerConfig } from './algolia-api.config'

// Only the fields this adapter actually reads -- real Alkosto/Ktronix hits
// carry 60+ fields (filters, comparison specs, promo banners) that aren't
// needed here. Field names/suffixes (_string, _double, _boolean, _mv for
// multi-value) are the storefront's own Algolia schema, confirmed live.
interface AlgoliaHit {
  objectID: string
  code_string?: string
  name_text_es?: string
  brand_string_mv?: string[]
  categoryname_text_es_mv?: string[]
  ['linea-modelo_string_mv']?: string[]
  lowestprice_double?: number
  discountprice_double?: number
  pricevalue_cop_double?: number
  instockflag_boolean?: boolean
  url_es_string?: string
  ['img-750wx750h_string']?: string
  ['img-1400wx1400h_string']?: string
}

interface AlgoliaQueryResponse {
  hits: AlgoliaHit[]
  nbHits: number
  nbPages: number
  page: number
}

// Strips NFD-decomposed combining diacritical marks by codepoint comparison
// -- see vtex-api.adapter.ts for why this avoids a regex unicode-range
// literal.
function stripDiacritics(value: string): string {
  return [...value].filter(char => {
    const code = char.codePointAt(0) ?? 0
    return code < 0x300 || code > 0x36f
  }).join('')
}

function slugify(value: string): string {
  return stripDiacritics(value.normalize('NFD')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'otros'
}

function mostSpecificCategory(names: string[] | undefined, fallback: { name: string; slug: string }) {
  const name = names?.at(-1)
  return name ? { name, slug: slugify(name) } : fallback
}

export class AlgoliaApiAdapter {
  constructor(private readonly config: AlgoliaRetailerConfig) {}

  // Algolia's single-index query endpoint, using the storefront's own
  // public search-only API key (see algolia-api.config.ts).
  async fetchPage(page: number, hitsPerPage: number): Promise<AlgoliaQueryResponse> {
    const url = `https://${this.config.appId.toLowerCase()}-dsn.algolia.net/1/indexes/${this.config.indexName}/query`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': this.config.apiKey,
        'X-Algolia-Application-Id': this.config.appId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '',
        filters: this.config.categoryFilter,
        page,
        hitsPerPage,
      }),
    })
    if (!response.ok) {
      throw new Error(`${this.config.name}: Algolia query failed (${response.status})`)
    }
    return response.json() as Promise<AlgoliaQueryResponse>
  }

  normalize(hit: AlgoliaHit): NormalizedRetailerItem | null {
    const price = hit.lowestprice_double ?? hit.discountprice_double ?? hit.pricevalue_cop_double
    if (!price || price <= 0) return null
    if (!hit.name_text_es || !hit.url_es_string) return null

    const category = mostSpecificCategory(hit.categoryname_text_es_mv, this.config.defaultCategory)
    const ean = hit.code_string && hit.code_string.length >= 12 ? hit.code_string : undefined
    const model = hit['linea-modelo_string_mv']?.[0] ?? hit.code_string ?? hit.objectID

    return {
      retailer: {
        name: this.config.name, slug: this.config.slug, abbr: this.config.abbr,
        primaryColor: this.config.primaryColor, websiteUrl: this.config.websiteUrl,
      },
      externalSku: hit.code_string ?? hit.objectID,
      sourceUrl: `${this.config.websiteUrl}${hit.url_es_string}`,
      name: hit.name_text_es,
      brand: hit.brand_string_mv?.[0]?.trim() || hit.name_text_es.split(/\s+/)[0] || 'Desconocida',
      model,
      ean,
      categoryName: category.name,
      categorySlug: category.slug,
      imageUrl: hit['img-750wx750h_string'] ?? hit['img-1400wx1400h_string'],
      price,
      shippingPrice: 0,
      available: Boolean(hit.instockflag_boolean),
      raw: { source: `${this.config.slug}-algolia-api`, fetchedAt: new Date().toISOString(), objectID: hit.objectID },
    }
  }
}
