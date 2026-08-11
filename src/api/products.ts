import type { Product } from '../types'
import { apiFetch } from './http'

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

  barcode(code: string): Promise<Product> {
    return apiFetch<Product>(`/products/barcode/${encodeURIComponent(code)}`)
  },
}
