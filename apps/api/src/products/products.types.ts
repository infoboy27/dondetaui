export interface OfferDto {
  store: string
  abbr: string
  color: string
  price: number
  shipping: string
  available: boolean
  updated: string
  distance?: string
  retailerId?: string
  storeId?: string
  url?: string
}

export interface ProductDto {
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
  discount: number
  previousPrice: number
  prices: OfferDto[]
  priceHistory: Array<{ date: string; price: number }>
  favorite?: boolean
  alerted?: boolean
}
