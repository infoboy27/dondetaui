import type { NormalizedRetailerItem } from './ingestion.types'

// Best Buy Products API (https://bestbuyapis.github.io/api-documentation/):
// the official catalog feed for affiliates, so no scraping. Needs a free key
// (BESTBUY_API_KEY); one page is up to 100 products.
export interface BestBuyConfig {
  apiKey: string
  /** categoryPath ids to ingest (abcat0900000 = appliances, abcat0101000 = TVs). */
  categoryIds: string[]
  websiteUrl: string
}

export interface BestBuyProduct {
  sku: number
  name?: string
  manufacturer?: string
  modelNumber?: string
  upc?: string
  salePrice?: number
  regularPrice?: number
  onlineAvailability?: boolean
  image?: string
  url?: string
  categoryPath?: { id: string; name: string }[]
}

export interface BestBuyPage {
  currentPage: number
  totalPages: number
  products: BestBuyProduct[]
}

const SHOW = 'sku,name,manufacturer,modelNumber,upc,salePrice,regularPrice,onlineAvailability,image,url,categoryPath.id,categoryPath.name'

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'product'
}

export class BestBuyAdapter {
  constructor(private readonly config: BestBuyConfig) {}

  async fetchPage(page: number, pageSize = 100): Promise<BestBuyPage> {
    const filter = this.config.categoryIds.map(id => `categoryPath.id=${id}`).join('|')
    const params = new URLSearchParams({ apiKey: this.config.apiKey, format: 'json', show: SHOW, pageSize: String(pageSize), page: String(page) })
    const response = await fetch(`https://api.bestbuy.com/v1/products((${filter}))?${params}`)
    if (!response.ok) throw new Error(`Best Buy: products query failed (${response.status})`)
    return response.json() as Promise<BestBuyPage>
  }

  normalize(product: BestBuyProduct): NormalizedRetailerItem | null {
    if (!product.name || !product.sku) return null
    // salePrice is what the customer pays today (regularPrice when not on sale).
    const price = product.salePrice && product.salePrice > 0 ? product.salePrice : product.regularPrice
    if (!price || price <= 0) return null

    const category = product.categoryPath?.at(-1)
    const upc = product.upc && product.upc.length >= 12 ? product.upc : undefined

    return {
      retailer: { name: 'Best Buy', slug: 'best-buy', abbr: 'BB', primaryColor: '#0046BE', websiteUrl: this.config.websiteUrl },
      externalSku: String(product.sku),
      sourceUrl: product.url ?? `${this.config.websiteUrl}/site/${slugify(product.name)}/${product.sku}.p`,
      name: product.name,
      brand: product.manufacturer?.trim() || product.name.split(/\s+/)[0] || 'Unknown',
      model: product.modelNumber?.trim() || String(product.sku),
      upc,
      categoryName: category?.name ?? 'Electronics',
      categorySlug: category ? slugify(category.name) : 'electronics',
      imageUrl: product.image,
      price,
      shippingPrice: 0,
      available: product.onlineAvailability === true,
      raw: { source: 'bestbuy-products-api', fetchedAt: new Date().toISOString(), sku: product.sku },
    }
  }
}
