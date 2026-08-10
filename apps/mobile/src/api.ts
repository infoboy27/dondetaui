export interface Offer {
  store: string
  abbr: string
  color: string
  price: number
  shipping: string
  available: boolean
  updated: string
  url?: string
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
  prices: Offer[]
  priceHistory: Array<{ date: string; price: number }>
}

const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api').replace(/\/$/, '')

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`)
  }

  return response.json() as Promise<T>
}

export const api = {
  list: () => request<Product[]>('/products'),
  search: (query: string) => request<Product[]>(`/search?q=${encodeURIComponent(query)}`),
  barcode: (code: string) => request<Product>(`/products/barcode/${encodeURIComponent(code)}`),
  get: (id: string) => request<Product>(`/products/${encodeURIComponent(id)}`),
}

export const money = (value: number) => `RD$${Math.round(value).toLocaleString('es-DO')}`

export const bestOffer = (product: Product) =>
  [...product.prices]
    .filter(offer => offer.available)
    .sort((a, b) => a.price - b.price)[0] ?? product.prices[0]
