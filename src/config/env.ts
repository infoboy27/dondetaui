const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000'

export const appConfig = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
} as const
