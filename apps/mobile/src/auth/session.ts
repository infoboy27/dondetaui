import * as SecureStore from 'expo-secure-store'
import { getCountry } from '../domain/currentCountry'

// Each country is its own backend with its own accounts, so each keeps its own
// session. DR keeps the original key so existing logins survive the update.
function tokenKey(): string {
  const { code } = getCountry()
  return code === 'DO' ? 'dondeta.authToken' : `dondeta.authToken.${code}`
}

// The owner panel's admin token (see src/api/admin.ts). Dropped whenever the
// session changes -- sign in, sign out, expiry -- so it never outlives the
// account that unlocked it.
export function adminTokenKey(): string {
  return `dondeta.adminToken.${getCountry().code}`
}

async function dropAdminToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(adminTokenKey())
  } catch {
    /* nothing stored */
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(tokenKey())
  } catch {
    return null
  }
}

export async function setToken(token: string): Promise<void> {
  await dropAdminToken()
  try {
    await SecureStore.setItemAsync(tokenKey(), token)
  } catch {
    /* storage unavailable — session just won't persist */
  }
}

export async function clearToken(): Promise<void> {
  await dropAdminToken()
  try {
    await SecureStore.deleteItemAsync(tokenKey())
  } catch {
    /* nothing to clean up if storage was never reachable */
  }
}
