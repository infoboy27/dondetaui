// Deployment-specific currency for server-generated text (alert messages,
// CLI logs, API responses) -- mirrors src/domain/currency.ts's web
// equivalent. Set via CURRENCY_SYMBOL/CURRENCY_LOCALE per country stack.
const CURRENCY_SYMBOL = process.env.CURRENCY_SYMBOL || 'RD$'
const CURRENCY_LOCALE = process.env.CURRENCY_LOCALE || 'es-DO'

// Whole units everywhere we sell in pesos (RD$41,995, like the apps and the
// web); cents only for the US stack (US$19.99).
const CURRENCY_DECIMALS = CURRENCY_LOCALE === 'en-US' ? 2 : 0

export function formatPrice(price: number): string {
  const amount = price.toLocaleString(CURRENCY_LOCALE, {
    minimumFractionDigits: CURRENCY_DECIMALS,
    maximumFractionDigits: CURRENCY_DECIMALS,
  })
  return `${CURRENCY_SYMBOL}${amount}`
}
