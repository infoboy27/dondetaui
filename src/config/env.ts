const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3001/api'
const useApi = import.meta.env.VITE_USE_API?.trim().toLowerCase() === 'true'

// Left unset until the AdSense site review is approved (post-domain-migration) --
// AdBanner falls back to the "Anúnciate aquí" placeholder whenever clientId or a
// given slot id is missing, so this is safe to leave blank in the meantime.
const adsenseClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim() || undefined

export const appConfig = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
  useApi,
  adsenseClientId,
  adsenseSlots: {
    leaderboard: import.meta.env.VITE_ADSENSE_SLOT_LEADERBOARD?.trim() || undefined,
    mediumRectangle: import.meta.env.VITE_ADSENSE_SLOT_MEDIUM_RECTANGLE?.trim() || undefined,
    mobileBanner: import.meta.env.VITE_ADSENSE_SLOT_MOBILE_BANNER?.trim() || undefined,
  },
} as const
