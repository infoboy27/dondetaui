import { apiFetch } from './http'

// Opt-in email digests, same API as the web (src/api/digests.ts). Only
// 'black-friday' for now: the real Black Friday offers (each price vs its own
// 30-day history), at most one email a day. Sent by the DR stack only.
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
}
