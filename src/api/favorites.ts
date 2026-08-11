import { apiFetch } from './http'

export interface Favorite {
  productId: string
  createdAt: string
}

export const favoritesApi = {
  list(): Promise<Favorite[]> {
    return apiFetch<Favorite[]>('/me/favorites')
  },

  create(productId: string): Promise<Favorite> {
    return apiFetch<Favorite>('/me/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })
  },

  remove(productId: string): Promise<void> {
    return apiFetch<void>(`/me/favorites/${encodeURIComponent(productId)}`, { method: 'DELETE' })
  },
}
