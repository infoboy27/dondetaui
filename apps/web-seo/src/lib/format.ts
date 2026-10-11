// Mirrors src/domain/currency.ts, but this is a server-rendered app so the
// values come from plain runtime env vars (set per country stack in
// docker-compose.yml) rather than a build-time Vite define.
const CURRENCY_SYMBOL = process.env.CURRENCY_SYMBOL || 'RD$'
const CURRENCY_LOCALE = process.env.CURRENCY_LOCALE || 'es-DO'

export function formatPrice(price: number): string {
  // Whole units: some retailers publish cents (RD$56,995.18), which only adds noise.
  return `${CURRENCY_SYMBOL}${Math.round(price).toLocaleString(CURRENCY_LOCALE)}`
}
