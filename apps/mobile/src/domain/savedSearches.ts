// Saved searches (notify when a matching product appears or drops under the
// max price). Pure, tested (savedSearches.test.ts).
import { formatPrice } from './currency'

export interface SavedSearch {
  id: string
  query: string
  maxPrice: number | null
  createdAt: string
}

export type MaxPriceInput = { ok: true; value: number | null } | { ok: false; error: string }

/** The max price field: empty = no limit; separators and currency symbols are ignored ("RD$25,000" -> 25000). */
export function parseMaxPrice(text: string): MaxPriceInput {
  const digits = text.replace(/[^0-9]/g, '')
  if (!text.trim()) return { ok: true, value: null }
  if (!digits) return { ok: false, error: 'Escribe el precio solo con números.' }
  const value = Number(digits)
  if (!(value > 0) || value >= 1_000_000_000) return { ok: false, error: 'Escribe un precio mayor que cero.' }
  return { ok: true, value }
}

/** Search box text worth saving: at least 2 characters once trimmed. */
export function canSaveSearch(query: string): boolean {
  return query.trim().length >= 2
}

/** Row subtitle, e.g. "Hasta RD$25,000" or "Cualquier precio". */
export function describeMaxPrice(maxPrice: number | null): string {
  return maxPrice === null ? 'Cualquier precio' : `Hasta ${formatPrice(maxPrice)}`
}
