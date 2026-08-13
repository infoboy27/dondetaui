// Deployment-specific currency for server-generated text (alert messages,
// CLI logs, API responses) -- mirrors src/domain/currency.ts's web
// equivalent. Set via CURRENCY_SYMBOL/CURRENCY_LOCALE per country stack.
const CURRENCY_SYMBOL = process.env.CURRENCY_SYMBOL || 'RD$'
const CURRENCY_LOCALE = process.env.CURRENCY_LOCALE || 'es-DO'

export function formatPrice(price: number): string {
  return `${CURRENCY_SYMBOL}${price.toLocaleString(CURRENCY_LOCALE)}`
}
