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
  if (!previous || !latest || latest.price >= previous.price) return null
  // The history is the day's lowest price across every offer ever attached to
  // the product. When it disagrees with the offers shown now (a stale listing,
  // or a bundle wrongly merged in) the "drop" is an artifact, not a sale.
  const current = Math.min(...product.prices.map(offer => offer.price))
  if (!Number.isFinite(current) || Math.abs(latest.price - current) > current * 0.02) return null

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

// "Bajaron de precio": the whole catalog's real recent drops, biggest first.
// Drops under minPct are noise (a peso of rounding, a shipping tweak).
// Gaming (Eneba marketplace) is left out, as on the web: its prices wobble
// daily and it has its own section.
export function getTopPriceDrops(products: Product[], limit = 10, minPct = 3): PriceDropNotification[] {
  const drops: PriceDropNotification[] = []
  for (const product of products) {
    if (product.categoryId === 'gaming') continue
    const drop = getRecentPriceDrop(product)
    if (drop && drop.pct >= minPct) drops.push({ product, ...drop })
  }
  return drops.sort((a, b) => b.pct - a.pct).slice(0, limit)
}
