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
  prices: Offer[]
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
