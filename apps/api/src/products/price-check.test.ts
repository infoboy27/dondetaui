import { describe, expect, it } from 'vitest'
import { buildReport, checkOffer, type OfferSeries } from './price-check'

function series(prices: number[], current: number, productId = 'p1'): OfferSeries {
  return {
    productId,
    productName: 'Nevera X',
    productSlug: 'nevera-x',
    image: '',
    store: 'Tienda',
    current,
    points: prices.map((price, i) => ({ date: `2026-10-${String(i + 1).padStart(2, '0')}`, price })),
  }
}

const flat = (price: number, days = 10) => Array.from({ length: days }, () => price)

describe('checkOffer', () => {
  it('needs at least a week of history', () => {
    expect(checkOffer(series(flat(10_000, 6), 8_000))).toBeNull()
  })

  it('a price below every price of the last 30 days is a real low', () => {
    const check = checkOffer(series(flat(10_000), 9_000))
    expect(check?.verdict).toBe('lowest')
    expect(check?.pctVsReference).toBe(-10)
  })

  it('a stable price says nothing', () => {
    expect(checkOffer(series(flat(10_000), 9_900))).toBeNull()
  })

  it('raised then cut back to the old price is an inflated discount', () => {
    const check = checkOffer(series([...flat(10_000, 5), ...flat(12_000, 5)], 10_000))
    expect(check?.verdict).toBe('inflated')
    expect(check?.reference).toBe(10_000)
    expect(check?.peak).toBe(12_000)
    expect(check?.pctBelowPeak).toBe(16.7)
  })

  it('a cut from a peak that came before the low is not inflated', () => {
    // 12k, then down to 10k, now 10.2k: no mark-up was taken back.
    expect(checkOffer(series([...flat(12_000, 5), ...flat(10_000, 5)], 10_200))).toBeNull()
  })

  it('currently above its 30-day low is raised', () => {
    const check = checkOffer(series(flat(10_000), 11_000))
    expect(check?.verdict).toBe('raised')
    expect(check?.pctVsReference).toBe(10)
  })

  it('ignores a one-off outlier observation', () => {
    // A bundle scraped once at 3k must not become the 30-day low.
    const check = checkOffer(series([...flat(10_000, 9), 3_000], 9_000))
    expect(check?.verdict).toBe('lowest')
    expect(check?.reference).toBe(10_000)
  })
})

describe('buildReport', () => {
  it('keeps one entry per product and sorts the best examples first', () => {
    const report = buildReport([
      series(flat(10_000), 9_500, 'a'),
      series(flat(10_000), 8_000, 'b'),
      series(flat(10_000), 7_000, 'b'),
      series(flat(10_000, 3), 5_000, 'c'),
    ])
    expect(report.lowest.map(c => [c.productId, c.current])).toEqual([['b', 7_000], ['a', 9_500]])
    expect(report.tracked).toBe(3)
  })
})
