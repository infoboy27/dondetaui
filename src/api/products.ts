import type { Product, StorePrice } from '../types'
import { apiFetch } from './http'

export interface ProductHistoryPoint {
  date: string
  price: number
}

export const productsApi = {
  list(): Promise<Product[]> {
    return apiFetch<Product[]>('/products')
  },

  search(query: string): Promise<Product[]> {
    const params = new URLSearchParams({ q: query })
    return apiFetch<Product[]>(`/search?${params.toString()}`)
  },

  get(productId: string): Promise<Product> {
    return apiFetch<Product>(`/products/${encodeURIComponent(productId)}`)
  },

  offers(productId: string): Promise<StorePrice[]> {
    return apiFetch<StorePrice[]>(`/products/${encodeURIComponent(productId)}/offers`)
  },

  history(productId: string): Promise<ProductHistoryPoint[]> {
    return apiFetch<ProductHistoryPoint[]>(`/products/${encodeURIComponent(productId)}/history`)
  },

  barcode(code: string): Promise<Product> {
    return apiFetch<Product>(`/products/barcode/${encodeURIComponent(code)}`)
  },
}
