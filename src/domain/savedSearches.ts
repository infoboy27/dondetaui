// Saved searches (notify when a matching product appears or drops under the
// max price). Created from the app's search screen; listed and removed on
// /cuenta/notificaciones. Mirror of apps/mobile/src/domain/savedSearches.ts.
import { formatPrice } from './currency'

export interface SavedSearch {
  id: string
  query: string
  maxPrice: number | null
  createdAt: string
}

/** Row subtitle, e.g. "Hasta RD$25,000" or "Cualquier precio". */
export function describeMaxPrice(maxPrice: number | null): string {
  return maxPrice === null ? 'Cualquier precio' : `Hasta ${formatPrice(maxPrice)}`
}
