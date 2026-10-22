import { getCountry } from './currentCountry'

// Whole units, like the design system's RD$24,495: converted prices (Eneba)
// carry cents that only add noise next to shelf prices. Countries whose shelf
// prices have cents (US) keep them when the amount has any. The exact amount
// is on the store's page.
export function formatPrice(price: number): string {
  const { currencySymbol, locale, cents } = getCountry()
  if (cents && !Number.isInteger(price)) {
    return `${currencySymbol}${price.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${currencySymbol}${Math.round(price).toLocaleString(locale)}`
}

/** Counts ("1,200 productos") in the user's number format. */
export function formatCount(count: number): string {
  return count.toLocaleString(getCountry().locale)
}
