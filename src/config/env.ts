const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3001/api'
const useApi = import.meta.env.VITE_USE_API?.trim().toLowerCase() === 'true'

// Left without ad-slot ids until the AdSense site review is approved.
// AdBanner renders nothing unless both the client id and placement slot exist,
// so app screens do not show ad placeholders during review.
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
