import { apiFetch } from './http'

// Opt-in email digests. Only 'black-friday' for now: the real Black Friday
// offers (each price vs its own 30-day history), at most one email a day.
export type DigestTopic = 'black-friday'

interface Status {
  subscribed: boolean
}

export const digestsApi = {
  async status(topic: DigestTopic): Promise<boolean> {
    return (await apiFetch<Status>(`/me/digests/${topic}`)).subscribed
  },

  async subscribe(topic: DigestTopic): Promise<boolean> {
    return (await apiFetch<Status>(`/me/digests/${topic}`, { method: 'PUT' })).subscribed
  },

  async unsubscribe(topic: DigestTopic): Promise<boolean> {
    return (await apiFetch<Status>(`/me/digests/${topic}`, { method: 'DELETE' })).subscribed
  },

  // One-click link from the email (no login).
  async unsubscribeByToken(token: string): Promise<void> {
    await apiFetch<unknown>('/digests/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  },
}
