import { apiFetch } from './http'
import { resolvePrefs, type NotificationPrefs } from '../domain/notificationPrefs'

// Per-type notification switches (email + push), stored on the account.
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
