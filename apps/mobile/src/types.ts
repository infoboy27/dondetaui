export interface User {
  id: string
  email: string
  name: string | null
  phone?: string | null
}

export interface PriceAlert {
  productId: string
  targetPrice: number | null
  createdAt: string
  product: Product
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

  slug?: string
  upc?: string
  ean?: string
}
