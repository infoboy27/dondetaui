export interface NormalizedRetailerItem {
  retailer: {
    name: string
    slug: string
    abbr: string
    primaryColor: string
    websiteUrl: string
  }
  externalSku: string
  sourceUrl: string
  name: string
  brand: string
  model: string
  ean?: string
  upc?: string
  categoryName: string
  categorySlug: string
  imageUrl?: string
  price: number
  shippingPrice: number
  available: boolean
  raw: Record<string, unknown>
}

export interface IngestionResult {
  productId: string
  variantId: string
  offerId: string
  createdProduct: boolean
}
