// Minimal subset of src/types.ts's Product/StorePrice — only what an SSR
// product page actually renders. Duplicated for the same reason as tokens.ts.
export interface Offer {
  store: string
  abbr: string
  color: string
  price: number
  shipping: string
  available: boolean
  totalPrice?: number
  shippingCost?: number
  url?: string
}

// One dated observation of a product's published price, as returned by the
// API's `priceHistory` array. The API records one point per ingestion cycle.
export interface PricePoint {
  date: string
  price: number
}

export interface Product {
  id: string
  slug: string
  name: string
  brand: string
  model: string
  subtitle: string
  image: string
  rating: number
  reviews: number
  category: string
  categoryId: string
  prices: Offer[]
  // Optional: `/products` and `/products/by-slug/:slug` include these, other
  // endpoints may not. `discount`/`previousPrice` are 0 when the API has no
  // reference price.
  priceHistory?: PricePoint[]
  previousPrice?: number
  discount?: number
}

export interface Store {
  id: string
  slug: string
  name: string
  abbr: string
  color: string
  websiteUrl: string | null
  logoUrl: string | null
  productCount: number
}

export interface Review {
  id: string
  userName: string
  rating: number
  comment: string | null
  createdAt: string
}

export interface ReviewSummary {
  average: number
  count: number
  reviews: Review[]
}
