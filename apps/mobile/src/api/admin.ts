import * as SecureStore from 'expo-secure-store'
import { ApiError, apiFetch } from './http'
import { adminTokenKey } from '../auth/session'
import { adminAccessFrom, type AdminAccess } from '../domain/adminAccess'

// The owner's metrics panel. The server is the gate (ADMIN_EMAILS + the
// authenticator code); this module only carries the short-lived admin token
// (12 h) minted by /admin/mfa/verify. It's cleared on sign-out so another
// account on the same phone never inherits it.

export interface AdminOverview {
  days: number
  generatedAt: string
  catalog: { products: number; offers: number; compared: number; retailers: number; lastSeenAt: string | null }
  clicks: {
    total: number
    byDay: Array<{ date: string; clicks: number }>
    bySource: Array<{ label: string; clicks: number }>
    topProducts: Array<{ name: string; slug: string; store: string; clicks: number }>
  }
  retailers: Array<{ slug: string; name: string; color: string; products: number; compared: number; wins: number; clicks: number }>
  analytics: {
    configured: boolean
    error: string | null
    data: null | {
      totals: { users: number; sessions: number; pageViews: number; avgSessionSeconds: number }
      byDay: Array<{ date: string; users: number; sessions: number; pageViews: number }>
      devices: Array<{ label: string; sessions: number }>
      channels: Array<{ label: string; sessions: number }>
      topPages: Array<{ label: string; pageViews: number }>
    }
  }
}

async function getAdminToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(adminTokenKey())
  } catch {
    return null
  }
}

export async function clearAdminToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(adminTokenKey())
  } catch {
    /* nothing stored */
  }
}

// Asked with the admin token when there is one, else with the shopper's
// session (which can only ever come back 'locked'/'setup' for the owner).
export async function adminAccess(): Promise<AdminAccess> {
  const token = await getAdminToken()
  try {
    await apiFetch('/admin/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
    return adminAccessFrom({ ok: true })
  } catch (error) {
    if (token && error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      await clearAdminToken() // expired or revoked: ask with the shopper's session instead
      return adminAccess()
    }
    return adminAccessFrom(error instanceof ApiError ? { ok: false, status: error.status, message: error.message } : { ok: false, status: 0 })
  }
}

export async function unlockAdmin(code: string): Promise<void> {
  const { token } = await apiFetch<{ token: string }>('/admin/mfa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  try {
    await SecureStore.setItemAsync(adminTokenKey(), token)
  } catch {
    throw new Error('No se pudo guardar la sesión del panel en este teléfono')
  }
}

export async function adminOverview(days: number): Promise<AdminOverview> {
  const token = await getAdminToken()
  if (!token) throw new ApiError('mfa_required', 403)
  try {
    return await apiFetch<AdminOverview>(`/admin/overview?days=${days}`, { headers: { Authorization: `Bearer ${token}` } })
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) await clearAdminToken()
    throw error
  }
}
