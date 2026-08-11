import { apiFetch } from './http'

export const pushTokenApi = {
  register(token: string, platform: 'android' | 'ios'): Promise<void> {
    return apiFetch<void>('/me/push-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform }),
    })
  },

  unregister(token: string): Promise<void> {
    return apiFetch<void>('/me/push-token', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  },
}
