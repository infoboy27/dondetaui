import type { PriceCheck } from '../products/price-check'

// The digest's product list: the price check's "lowest" verdicts (already
// sorted, deepest under the 30-day low first, one per product), minus the
// excluded products (gaming) and anything without a page to link to.
export function pickDigestDeals(lowest: PriceCheck[], excluded: Set<string>, max: number): PriceCheck[] {
  return lowest.filter(c => !excluded.has(c.productId) && c.productSlug && c.verdict === 'lowest').slice(0, max)
}
