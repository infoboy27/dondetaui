export type Screen =
  | 'home'
  | 'search'
  | 'results'
  | 'product'
  | 'scanner'
  | 'alerts'
  | 'profile'
  | 'equipa'
  | 'store'
  | 'nearby'

export type Tab = 'home' | 'search' | 'scanner' | 'alerts' | 'profile'

export interface StorePrice {
  store: string
  abbr: string
  color: string
  price: number
  shipping: string
  available: boolean
  updated: string
  distance?: string
}

export interface Product {
  id: string
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
  prices: StorePrice[]
  priceHistory: { date: string; price: number }[]
  favorite?: boolean
  alerted?: boolean
}
