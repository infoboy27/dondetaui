import { apiFetch } from './http'
import type { SavedSearch } from '../domain/savedSearches'

export const savedSearchesApi = {
  list(): Promise<SavedSearch[]> {
    return apiFetch<SavedSearch[]>('/me/saved-searches')
  },

  save(query: string, maxPrice: number | null): Promise<SavedSearch> {
    return apiFetch<SavedSearch>('/me/saved-searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, maxPrice }),
    })
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/me/saved-searches/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}
