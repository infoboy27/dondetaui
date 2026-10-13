import type { User } from '../types'

const TOKEN_KEY = 'dondeta.authToken'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* storage unavailable (private browsing, etc.) — session just won't persist */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* nothing to clean up if storage was never reachable */
  }
}

// Session changes made outside useAuth (two-step sign-in finished in the
// auth form, password reset, account settings) are announced here; useAuth
// listens and updates the signed-in user everywhere. `null` = signed out.

type SessionEvent = { token?: string; user: User } | null
const listeners = new Set<(event: SessionEvent) => void>()

export function subscribeSession(listener: (event: SessionEvent) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitSession(event: SessionEvent): void {
  if (event?.token) setToken(event.token)
  if (event === null) clearToken()
  listeners.forEach(listener => listener(event))
}
