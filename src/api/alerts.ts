import type { PriceAlert } from '../types'
import { apiFetch } from './http'

export const alertsApi = {
  list(): Promise<PriceAlert[]> {
    return apiFetch<PriceAlert[]>('/me/alerts')
  },

  create(productId: string, targetPrice?: number): Promise<PriceAlert> {
    return apiFetch<PriceAlert>('/me/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, targetPrice }),
    })
  },

  remove(productId: string): Promise<void> {
    return apiFetch<void>(`/me/alerts/${encodeURIComponent(productId)}`, { method: 'DELETE' })
  },
}
