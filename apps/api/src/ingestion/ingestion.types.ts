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
  // Shown under the product name; defaults to the model. Digital products
  // (Eneba) have an opaque listing id as model, so they say what they are.
  subtitle?: string
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
