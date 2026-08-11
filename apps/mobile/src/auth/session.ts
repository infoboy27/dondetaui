import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'dondeta.authToken'

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
  } catch {
    /* storage unavailable — session just won't persist */
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  } catch {
    /* nothing to clean up if storage was never reachable */
  }
}
