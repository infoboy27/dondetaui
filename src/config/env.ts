const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3001/api'
const useApi = import.meta.env.VITE_USE_API?.trim().toLowerCase() === 'true'

export const appConfig = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
  useApi,
} as const
