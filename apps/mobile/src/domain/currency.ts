// Baked in at Expo build time -- each country's app build sets its own
// EXPO_PUBLIC_CURRENCY_SYMBOL/EXPO_PUBLIC_CURRENCY_LOCALE (mirrors
// src/domain/currency.ts's Vite build-arg pattern for the web SPA).
const CURRENCY_SYMBOL = process.env.EXPO_PUBLIC_CURRENCY_SYMBOL || 'RD$'
const CURRENCY_LOCALE = process.env.EXPO_PUBLIC_CURRENCY_LOCALE || 'es-DO'

// Whole pesos, like the design system's RD$24,495: converted prices (Eneba)
// carry cents that only add noise next to shelf prices. The exact amount is
// on the store's page.
export function formatPrice(price: number): string {
  return `${CURRENCY_SYMBOL}${Math.round(price).toLocaleString(CURRENCY_LOCALE)}`
}
