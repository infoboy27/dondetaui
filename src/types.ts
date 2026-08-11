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
  | 'notifications'
  | 'login'

export type Tab = 'home' | 'search' | 'scanner' | 'alerts' | 'profile'

export interface User {
  id: string
  email: string
  name: string | null
}

export interface StorePrice {
  store: string
  abbr: string
  color: string
  price: number
  shipping: string
  available: boolean
  updated: string
  distance?: string

  // Optional production-facing fields. The current Figma Make prototype does
  // not require them yet, but API-backed offers can populate them without
  // forcing another UI-domain type migration.
  retailerId?: string
  storeId?: string
  externalSku?: string
  url?: string
  shippingCost?: number
  totalPrice?: number
  lastSeenAt?: string
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

  // Product identity fields used by future exact-match and barcode flows.
  slug?: string
  upc?: string
  ean?: string
}
