// "¿La oferta es real?" -- the Black Friday price check (/black-friday).
//
// Each live offer is judged against its own recent history in that store,
// the way the EU's Omnibus rule judges announced discounts: the reference is
// the lowest price of the previous 30 days. So
//   - lowest:   today is clearly below every price of the last 30 days,
//   - inflated: the price went up and then "came down", but not below what
//               it already cost before the rise -- the discount is a mark-up
//               taken back,
//   - raised:   it costs clearly more than its 30-day low right now (worth
//               watching: a later "sale" back to that low isn't a sale).
// Pure functions; the SQL that feeds them is in ProductsRepository.priceCheck.

export interface PricePoint {
  date: string
  price: number
}

export interface OfferSeries {
  productId: string
  productName: string
  productSlug: string
  image: string
  store: string
  current: number
  /** Daily lowest price in this store over the previous 30 days, excluding today. */
  points: PricePoint[]
}

export type Verdict = 'lowest' | 'inflated' | 'raised'

export interface PriceCheck extends Omit<OfferSeries, 'points'> {
  verdict: Verdict
  /** Lowest price of the previous 30 days, and when. */
  reference: number
  referenceDate: string
  /** Highest price of the previous 30 days, and when. */
  peak: number
  peakDate: string
  /** current vs reference, in % (negative = cheaper than ever in 30 days). */
  pctVsReference: number
  /** How far current sits below the 30-day peak, in % (>= 0). */
  pctBelowPeak: number
  days: number
}

export interface PriceCheckReport {
  generatedAt: string
  tracked: number
  lowest: PriceCheck[]
  inflated: PriceCheck[]
  raised: PriceCheck[]
}

export const MIN_DAYS = 7 // fewer observations than this says nothing
const LOWEST_BELOW = 0.97 // 3% under the 30-day low
const INFLATED_DROP = 0.05 // a visible "rebaja" of 5%+ from the peak
const RAISED_ABOVE = 1.05 // 5% over the 30-day low

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function checkOffer(series: OfferSeries): PriceCheck | null {
  const valid = series.points.filter(p => Number.isFinite(p.price) && p.price > 0)
  if (valid.length < MIN_DAYS || !(series.current > 0)) return null
  // A mismatched listing scraped once (a bundle, a typo'd price) would
  // otherwise become the 30-day low or peak; ignore far-off points.
  const mid = median(valid.map(p => p.price))
  const points = valid.filter(p => p.price >= mid * 0.5 && p.price <= mid * 1.8)
  if (points.length < MIN_DAYS) return null

  let low = points[0]
  let peak = points[0]
  for (const p of points) {
    if (p.price < low.price) low = p
    if (p.price > peak.price) peak = p
  }
  const current = series.current
  const pctBelowPeak = Math.max(0, round1(((peak.price - current) / peak.price) * 100))

  let verdict: Verdict | null = null
  if (current <= low.price * LOWEST_BELOW) verdict = 'lowest'
  else if (peak.date > low.date && current <= peak.price * (1 - INFLATED_DROP) && current >= low.price * 0.99) verdict = 'inflated'
  else if (current >= low.price * RAISED_ABOVE) verdict = 'raised'
  if (!verdict) return null

  const { points: _points, ...rest } = series
  return {
    ...rest,
    verdict,
    reference: low.price,
    referenceDate: low.date,
    peak: peak.price,
    peakDate: peak.date,
    pctVsReference: round1(((current - low.price) / low.price) * 100),
    pctBelowPeak,
    days: points.length,
  }
}

// One entry per product (its most telling offer), best examples first.
export function buildReport(all: OfferSeries[], limit = 30, now = new Date()): PriceCheckReport {
  const checks: PriceCheck[] = []
  let tracked = 0
  for (const series of all) {
    if (series.points.length >= MIN_DAYS) tracked++
    const check = checkOffer(series)
    if (check) checks.push(check)
  }
  const pick = (verdict: Verdict, order: (a: PriceCheck, b: PriceCheck) => number) => {
    const seen = new Set<string>()
    return checks
      .filter(c => c.verdict === verdict)
      .sort(order)
      .filter(c => !seen.has(c.productId) && seen.add(c.productId))
      .slice(0, limit)
  }
  return {
    generatedAt: now.toISOString(),
    tracked,
    lowest: pick('lowest', (a, b) => a.pctVsReference - b.pctVsReference),
    inflated: pick('inflated', (a, b) => b.pctBelowPeak - a.pctBelowPeak),
    raised: pick('raised', (a, b) => b.pctVsReference - a.pctVsReference),
  }
}
