import { apiFetch } from './http'

export const searchHistoryApi = {
  list(): Promise<string[]> {
    return apiFetch<string[]>('/me/search-history')
  },

  record(query: string): Promise<void> {
    return apiFetch<void>('/me/search-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
  },

  clear(): Promise<void> {
    return apiFetch<void>('/me/search-history', { method: 'DELETE' })
  },
}
