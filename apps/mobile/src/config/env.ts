const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api').replace(/\/$/, '')

export const appConfig = {
  apiBaseUrl,
} as const
