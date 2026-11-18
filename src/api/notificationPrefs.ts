import { apiFetch } from './http'
import { resolvePrefs, type NotificationPrefs } from '../domain/notificationPrefs'
import type { SavedSearch } from '../domain/savedSearches'

// Per-type notification switches (email + push), stored on the account, and
// the saved searches they apply to. Same endpoints as the mobile app.
interface PrefsResponse {
  prefs: unknown
}

export const notificationPrefsApi = {
  async get(): Promise<NotificationPrefs> {
    return resolvePrefs((await apiFetch<PrefsResponse>('/me/notification-preferences')).prefs)
  },

  async update(patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    const response = await apiFetch<PrefsResponse>('/me/notification-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefs: patch }),
    })
    return resolvePrefs(response.prefs)
  },
}

export const savedSearchesApi = {
  list(): Promise<SavedSearch[]> {
    return apiFetch<SavedSearch[]>('/me/saved-searches')
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/me/saved-searches/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}
