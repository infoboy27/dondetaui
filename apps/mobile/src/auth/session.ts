import * as SecureStore from 'expo-secure-store'
import { getCountry } from '../config/currentCountry'

// Each country is its own backend with its own accounts, so each keeps its own
// session. DR keeps the original key so existing logins survive the update.
function tokenKey(): string {
  const { code } = getCountry()
  return code === 'DO' ? 'dondeta.authToken' : `dondeta.authToken.${code}`
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(tokenKey())
  } catch {
    return null
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(tokenKey(), token)
  } catch {
    /* storage unavailable — session just won't persist */
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(tokenKey())
  } catch {
    /* nothing to clean up if storage was never reachable */
  }
}
