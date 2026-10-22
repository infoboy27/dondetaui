import { COUNTRY, CURRENCY_LOCALE, CURRENCY_SYMBOL } from './site'

export function formatPrice(price: number): string {
  // US prices keep cents when non-integer ($19.99). Elsewhere whole units:
  // some retailers publish cents (RD$56,995.18), which only adds noise.
  if (COUNTRY.code === 'US') {
    const cents = Math.round(price * 100) / 100
    return `${CURRENCY_SYMBOL}${cents.toLocaleString(CURRENCY_LOCALE, Number.isInteger(cents) ? undefined : { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${CURRENCY_SYMBOL}${Math.round(price).toLocaleString(CURRENCY_LOCALE)}`
}
