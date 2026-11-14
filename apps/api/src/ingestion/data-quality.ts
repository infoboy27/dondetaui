// Rules for the automatic data-quality pass (data-quality.cli.ts). Plain
// module, no database, so the root vitest run covers it.

// One store listing two different products on the same variant means a bad
// match (every KTC TV once said "AND11"). Prices this far apart are clearly
// different items; closer ones are usually the same item listed twice.
export const SAME_STORE_SPLIT_RATIO = 1.15

// Different stores' prices for one product this far apart: probably two
// different items matched together. Flagged for a human, not auto-fixed.
export const CROSS_STORE_OUTLIER_RATIO = 2.5

// Consecutive definitive failures before an image is cleared.
export const IMAGE_FAILURES_TO_CLEAR = 2

export interface SameStoreOffer {
  id: string
  externalSku: string
  price: number
  createdAt: Date
}

export function priceSpread(prices: number[]): number {
  const valid = prices.filter(p => Number.isFinite(p) && p > 0)
  if (valid.length < 2) return 1
  return Math.max(...valid) / Math.min(...valid)
}

/**
 * Which offers to detach from a variant one store lists several times with
 * clearly different prices. Keeps the listing that created the variant
 * (variant.manufacturer_sku), else the oldest; returns the rest. Empty when
 * the prices are close enough to be the same item listed twice.
 */
export function offersToDetach(offers: SameStoreOffer[], creatorSku: string | null): SameStoreOffer[] {
  if (offers.length < 2) return []
  if (priceSpread(offers.map(o => o.price)) <= SAME_STORE_SPLIT_RATIO) return []
  const keep =
    offers.find(o => creatorSku && o.externalSku === creatorSku) ??
    [...offers].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]!
  return offers.filter(o => o !== keep)
}

export type ImageCheck = 'ok' | 'broken' | 'unknown'

/** A browser-like fetch result → whether the image is definitively broken. Timeouts and 5xx are "unknown". */
export function classifyImageResponse(status: number | null, contentType: string | null): ImageCheck {
  if (status === null) return 'unknown'
  if (status === 403 || status === 404 || status === 410) return 'broken'
  if (status >= 500 || status === 429) return 'unknown'
  if (status >= 200 && status < 300) return contentType?.toLowerCase().startsWith('image/') ? 'ok' : 'broken'
  return 'unknown'
}

export interface QualitySummary {
  site: string
  detachedOffers: Array<{ product: string; retailer: string; prices: number[] }>
  clearedImages: Array<{ product: string; host: string }>
  imagesChecked: number
  newOutliers: Array<{ product: string; slug: string; detail: string }>
  openOutliers: number
}

function list<T>(items: T[], render: (item: T) => string, max = 8): string[] {
  const lines = items.slice(0, max).map(item => `  - ${render(item)}`)
  if (items.length > max) lines.push(`  - … y ${items.length - max} más`)
  return lines
}

/** Discord message, or null when there's nothing worth a ping. */
export function qualityReportMessage(summary: QualitySummary, formatPrice: (n: number) => string): string | null {
  const { detachedOffers, clearedImages, newOutliers } = summary
  if (!detachedOffers.length && !clearedImages.length && !newOutliers.length) return null
  const lines = [`🧹 Calidad de datos ${summary.site}`]
  if (detachedOffers.length) {
    lines.push(`• Separé ${detachedOffers.length} ofertas pegadas a un producto equivocado (la ingesta las vuelve a crear bien):`)
    lines.push(...list(detachedOffers, d => `${d.retailer}: ${d.product.slice(0, 70)} (${d.prices.map(formatPrice).join(' / ')})`))
  }
  if (clearedImages.length) {
    lines.push(`• Quité ${clearedImages.length} imágenes rotas (de ${summary.imagesChecked} revisadas); la próxima ingesta pone una que funcione:`)
    lines.push(...list(clearedImages, c => `${c.host}: ${c.product.slice(0, 70)}`, 5))
  }
  if (newOutliers.length) {
    lines.push(`• ${newOutliers.length} productos con precios muy distintos entre tiendas (¿productos distintos emparejados?), revisa a mano:`)
    lines.push(...list(newOutliers, o => `${o.product.slice(0, 60)}: ${o.detail} → /product/${o.slug}`))
  }
  if (summary.openOutliers > newOutliers.length) lines.push(`• Siguen abiertos ${summary.openOutliers} casos de precios muy distintos.`)
  return lines.join('\n')
}
