import type { Product } from '../types'
import { apiFetch } from './http'

export const productsApi = {
  list(): Promise<Product[]> {
    return apiFetch<Product[]>('/products')
  },

  // Home sections only: multi-store products and recent price movers.
  highlights(): Promise<{ total: number; stores: number; products: Product[]; gaming?: Product[] }> {
    return apiFetch('/products/highlights')
  },

  search(query: string): Promise<Product[]> {
    const params = new URLSearchParams({ q: query })
    return apiFetch<Product[]>(`/search?${params.toString()}`)
  },

  get(productId: string): Promise<Product> {
    return apiFetch<Product>(`/products/${encodeURIComponent(productId)}`)
  },

  getBySlug(slug: string): Promise<Product> {
    return apiFetch<Product>(`/products/by-slug/${encodeURIComponent(slug)}`)
  },

  barcode(code: string): Promise<Product> {
    return apiFetch<Product>(`/products/barcode/${encodeURIComponent(code)}`)
  },
}
