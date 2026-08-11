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

// A physical branch location -- distinct from Store, which is the
// retailer/chain. A retailer has many branches.
export interface StoreBranch {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  retailer: { slug: string; name: string; abbr: string; color: string }
  distanceKm?: number
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

  branches(slug: string): Promise<StoreBranch[]> {
    return apiFetch<StoreBranch[]>(`/stores/${encodeURIComponent(slug)}/branches`)
  },

  nearby(latitude: number, longitude: number, radiusKm = 25): Promise<StoreBranch[]> {
    const params = new URLSearchParams({ lat: String(latitude), lng: String(longitude), radiusKm: String(radiusKm) })
    return apiFetch<StoreBranch[]>(`/stores/nearby?${params.toString()}`)
  },
}
