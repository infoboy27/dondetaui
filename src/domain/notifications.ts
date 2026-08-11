import type { Product } from '../types'

export interface PriceDropNotification {
  product: Product
  oldPrice: number
  newPrice: number
  pct: number
  date: string
}

// A real drop between the two most recent price-history points (same points
// PriceHistoryChart already renders) -- null when there's no history or the
// price didn't drop. Ingested products never populate the static
// products.discount column (see apps/api/src/ingestion/ingestion.repository.ts),
// so this is the only honest way to tell a real product actually went on sale.
export function getRecentPriceDrop(product: Product): Omit<PriceDropNotification, 'product'> | null {
  const history = product.priceHistory
  if (history.length < 2) return null

  const previous = history[history.length - 2]
  const latest = history[history.length - 1]
  if (latest.price >= previous.price) return null

  return {
    oldPrice: previous.price,
    newPrice: latest.price,
    pct: Math.round(((previous.price - latest.price) / previous.price) * 100),
    date: latest.date,
  }
}

// Alerted products only, with a real price drop -- not a fabricated feed.
export function getPriceDropNotifications(products: Product[], alertedIds: Set<string>): PriceDropNotification[] {
  const notifications: PriceDropNotification[] = []

  for (const product of products) {
    if (!alertedIds.has(product.id)) continue

    const drop = getRecentPriceDrop(product)
    if (!drop) continue

    notifications.push({ product, ...drop })
  }

  return notifications.sort((a, b) => b.pct - a.pct)
}
