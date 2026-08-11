import type { Product } from '../types'
import { apiFetch } from './http'

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

export const storesApi = {
  list(): Promise<Store[]> {
    return apiFetch<Store[]>('/stores')
  },

  get(slug: string): Promise<Store> {
    return apiFetch<Store>(`/stores/${encodeURIComponent(slug)}`)
  },

  products(slug: string): Promise<Product[]> {
    return apiFetch<Product[]>(`/stores/${encodeURIComponent(slug)}/products`)
  },
}
