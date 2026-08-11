import type { Product } from '../types'

export interface PriceDropNotification {
  product: Product
  oldPrice: number
  newPrice: number
  pct: number
  date: string
}

// Alerted products only: a real drop between the two most recent price-history
// points (same points PriceHistoryChart already renders), not a fabricated feed.
export function getPriceDropNotifications(products: Product[], alertedIds: Set<string>): PriceDropNotification[] {
  const notifications: PriceDropNotification[] = []

  for (const product of products) {
    if (!alertedIds.has(product.id)) continue

    const history = product.priceHistory
    if (history.length < 2) continue

    const previous = history[history.length - 2]
    const latest = history[history.length - 1]
    if (latest.price >= previous.price) continue

    notifications.push({
      product,
      oldPrice: previous.price,
      newPrice: latest.price,
      pct: Math.round(((previous.price - latest.price) / previous.price) * 100),
      date: latest.date,
    })
  }

  return notifications.sort((a, b) => b.pct - a.pct)
}
