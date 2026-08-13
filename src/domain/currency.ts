// Deployment-specific currency, baked in at Vite build time via
// VITE_CURRENCY_SYMBOL/VITE_CURRENCY_LOCALE build args (see Dockerfile.web) --
// each country stack (dondeta.com.do, dondeta.co, dondeta.mx) sets its own.
const CURRENCY_SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL || 'RD$'
const CURRENCY_LOCALE = import.meta.env.VITE_CURRENCY_LOCALE || 'es-DO'

export function formatPrice(price: number): string {
  return `${CURRENCY_SYMBOL}${price.toLocaleString(CURRENCY_LOCALE)}`
}
