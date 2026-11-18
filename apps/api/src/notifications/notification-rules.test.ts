import { describe, expect, it } from 'vitest'
import {
  addDays,
  buildWeeklyDigest,
  cardPromotionIsNew,
  countryUtcOffsetHours,
  dealRealPct,
  dealSeason,
  eventKeys,
  formatDayEs,
  isLowestIn90Days,
  isoWeekKey,
  localDate,
  mergeLowestIntoDrop,
  nextStockState,
  observedStock,
  pointsBefore,
  priceOnOrBefore,
  savedSearchReason,
  weekdaysPhrase,
  weeklyDigestSlot,
  weeklyDigestSummary,
  type PricePoint,
  type WeeklyItem,
} from './notification-rules'

function series(days: number, price: (i: number) => number, end = '2026-11-17'): PricePoint[] {
  return Array.from({ length: days }, (_, i) => ({ date: addDays(end, -(days - i)), price: price(i) }))
}

describe('dates', () => {
  it('maps country stacks to their UTC offset (DR by default)', () => {
    expect(countryUtcOffsetHours(undefined)).toBe(-4)
    expect(countryUtcOffsetHours('do')).toBe(-4)
    expect(countryUtcOffsetHours('CO')).toBe(-5)
    expect(countryUtcOffsetHours('MX')).toBe(-6)
  })

  it('uses the local calendar date', () => {
    expect(localDate(new Date('2026-11-18T03:00:00Z'), -4)).toBe('2026-11-17')
    expect(localDate(new Date('2026-11-18T05:00:00Z'), -4)).toBe('2026-11-18')
  })

  it('builds ISO week keys, including the year boundary', () => {
    expect(isoWeekKey('2026-11-22')).toBe('2026-W47')
    expect(isoWeekKey('2026-11-23')).toBe('2026-W48')
    expect(isoWeekKey('2027-01-01')).toBe('2026-W53')
  })

  it('formats days in Spanish', () => {
    expect(formatDayEs('2026-11-30')).toBe('30 de noviembre')
    expect(formatDayEs('nope')).toBe('nope')
  })
})

describe('back_in_stock', () => {
  it('reads stock from fresh offers; no fresh offer is unknown', () => {
    expect(observedStock(1, 3)).toBe('in_stock')
    expect(observedStock(0, 2)).toBe('out_of_stock')
    expect(observedStock(0, 0)).toBe('unknown')
  })

  it('fires only on out_of_stock -> in_stock', () => {
    expect(nextStockState('out_of_stock', 'in_stock')).toEqual({ state: 'in_stock', backInStock: true })
    expect(nextStockState('in_stock', 'in_stock')).toEqual({ state: 'in_stock', backInStock: false })
    expect(nextStockState('in_stock', 'out_of_stock')).toEqual({ state: 'out_of_stock', backInStock: false })
  })

  it('just records the first observation', () => {
    expect(nextStockState(null, 'in_stock')).toEqual({ state: 'in_stock', backInStock: false })
  })

  it('keeps the stored state when the stock is unknown (a scraper hiccup is not a restock)', () => {
    expect(nextStockState('out_of_stock', 'unknown')).toEqual({ state: 'out_of_stock', backInStock: false })
    expect(nextStockState(null, 'unknown')).toEqual({ state: null, backInStock: false })
  })
})

describe('lowest_price_90d', () => {
  const history = series(30, i => 1000 + (i % 3) * 10)

  it('fires when today is strictly below every price of the window', () => {
    expect(isLowestIn90Days(990, history)).toBe(true)
  })

  it('does not fire at or above the window low', () => {
    expect(isLowestIn90Days(1000, history)).toBe(false)
    expect(isLowestIn90Days(1200, history)).toBe(false)
  })

  it('needs enough history and a price', () => {
    expect(isLowestIn90Days(500, series(10, () => 1000))).toBe(false)
    expect(isLowestIn90Days(null, history)).toBe(false)
    expect(isLowestIn90Days(0, history)).toBe(false)
  })

  it('ignores an implausible price (under half the usual)', () => {
    expect(isLowestIn90Days(400, history)).toBe(false)
  })

  it('pointsBefore keeps the window and drops today', () => {
    const points = [{ date: '2026-08-01', price: 1 }, { date: '2026-11-16', price: 2 }, { date: '2026-11-17', price: 3 }]
    expect(pointsBefore(points, '2026-11-17', 90)).toEqual([{ date: '2026-11-16', price: 2 }])
  })

  it('merges into the price-drop message only when the user wants it and it is a 90-day low', () => {
    expect(mergeLowestIntoDrop(true, true)).toBe(true)
    expect(mergeLowestIntoDrop(false, true)).toBe(false)
    expect(mergeLowestIntoDrop(true, false)).toBe(false)
  })

  it('shares the dedupe key with the merged price-drop message (one per product per day)', () => {
    expect(eventKeys.lowest90d('p1', '2026-11-17')).toBe('p1:2026-11-17')
  })
})

describe('card_discount', () => {
  const today = '2026-11-17'

  it('fires for a promotion that started or was loaded today or yesterday', () => {
    expect(cardPromotionIsNew({ startsOn: today, endsOn: '2026-11-30', createdOn: '2026-11-10' }, today)).toBe(true)
    expect(cardPromotionIsNew({ startsOn: '2026-11-01', endsOn: '2026-11-30', createdOn: '2026-11-16' }, today)).toBe(true)
  })

  it('does not announce promotions that were already running', () => {
    expect(cardPromotionIsNew({ startsOn: '2026-11-01', endsOn: '2026-11-30', createdOn: '2026-11-01' }, today)).toBe(false)
  })

  it('does not fire before it starts or after it ends', () => {
    expect(cardPromotionIsNew({ startsOn: '2026-11-18', endsOn: '2026-11-30', createdOn: today }, today)).toBe(false)
    expect(cardPromotionIsNew({ startsOn: '2026-11-10', endsOn: '2026-11-16', createdOn: '2026-11-16' }, today)).toBe(false)
  })

  it('words the weekdays', () => {
    expect(weekdaysPhrase(null)).toBe('')
    expect(weekdaysPhrase([0, 1, 2, 3, 4, 5, 6])).toBe('')
    expect(weekdaysPhrase([2])).toBe(' los martes')
    expect(weekdaysPhrase([4, 2, 6])).toBe(' los martes, jueves y sábados')
  })
})

describe('saved_search', () => {
  const saved = '2026-11-10T12:00:00.000Z'

  it('fires for a product added after the search was saved', () => {
    expect(savedSearchReason({ createdAt: saved, maxPrice: null }, { createdAt: '2026-11-15T00:00:00Z', current: 5000, previous: null })).toBe('new')
  })

  it('does not fire for products that were already there, without a max price', () => {
    expect(savedSearchReason({ createdAt: saved, maxPrice: null }, { createdAt: '2026-01-01T00:00:00Z', current: 5000, previous: 6000 })).toBeNull()
  })

  it('fires when a product crosses under the max price', () => {
    expect(savedSearchReason({ createdAt: saved, maxPrice: 20000 }, { createdAt: '2026-01-01T00:00:00Z', current: 19000, previous: 21000 })).toBe('under_max')
  })

  it('does not fire when it was already under the max, or is still over it', () => {
    expect(savedSearchReason({ createdAt: saved, maxPrice: 20000 }, { createdAt: '2026-01-01T00:00:00Z', current: 19000, previous: 19500 })).toBeNull()
    expect(savedSearchReason({ createdAt: saved, maxPrice: 20000 }, { createdAt: '2026-01-01T00:00:00Z', current: 19000, previous: null })).toBeNull()
    expect(savedSearchReason({ createdAt: saved, maxPrice: 20000 }, { createdAt: '2026-11-15T00:00:00Z', current: 25000, previous: null })).toBeNull()
  })

  it('ignores products without a price', () => {
    expect(savedSearchReason({ createdAt: saved, maxPrice: null }, { createdAt: '2026-11-15T00:00:00Z', current: 0, previous: null })).toBeNull()
  })
})

describe('deal_real', () => {
  it('is on from the Monday before Black Friday through Cyber Monday (2026: Nov 23-30)', () => {
    expect(dealSeason(new Date('2026-11-22T20:00:00Z'), -4)).toBeNull()
    expect(dealSeason(new Date('2026-11-23T12:00:00Z'), -4)).toEqual({ key: 'black-friday-2026', name: 'Black Friday' })
    expect(dealSeason(new Date('2026-11-27T12:00:00Z'), -4)?.name).toBe('Black Friday')
    expect(dealSeason(new Date('2026-11-30T12:00:00Z'), -4)).toEqual({ key: 'black-friday-2026', name: 'Cyber Monday' })
    expect(dealSeason(new Date('2026-12-01T12:00:00Z'), -4)).toBeNull()
  })

  it('fires when today is clearly under the 30-day average', () => {
    expect(dealRealPct(900, series(10, () => 1000))).toBe(10)
  })

  it('does not fire within the noise margin or above the average', () => {
    expect(dealRealPct(980, series(10, () => 1000))).toBeNull()
    expect(dealRealPct(1100, series(10, () => 1000))).toBeNull()
  })

  it('needs a week of history and a price', () => {
    expect(dealRealPct(500, series(5, () => 1000))).toBeNull()
    expect(dealRealPct(null, series(10, () => 1000))).toBeNull()
  })
})

describe('weekly_digest', () => {
  it('goes out on Sunday from 10:00 local time, keyed by ISO week', () => {
    expect(weeklyDigestSlot(new Date('2026-11-22T14:00:00Z'), -4)).toEqual({ key: '2026-W47' })
    expect(weeklyDigestSlot(new Date('2026-11-22T13:59:00Z'), -4)).toBeNull()
    expect(weeklyDigestSlot(new Date('2026-11-23T14:00:00Z'), -4)).toBeNull()
  })

  it('finds the price on or before a day', () => {
    const points = [{ date: '2026-11-08', price: 100 }, { date: '2026-11-10', price: 90 }, { date: '2026-11-12', price: 80 }]
    expect(priceOnOrBefore(points, '2026-11-11')).toBe(90)
    expect(priceOnOrBefore(points, '2026-11-01')).toBeNull()
  })

  const item = (id: string, current: number | null, weekAgo: number | null): WeeklyItem =>
    ({ productId: id, name: id, slug: id, imageUrl: null, store: 'Jumbo', current, weekAgo })

  it('lists drops (biggest first) and rises, skipping noise and missing prices', () => {
    const digest = buildWeeklyDigest([
      item('a', 900, 1000),
      item('b', 800, 1000),
      item('c', 1100, 1000),
      item('d', 995, 1000),
      item('e', null, 1000),
      item('f', 500, null),
    ])
    expect(digest?.dropped.map(c => c.productId)).toEqual(['b', 'a'])
    expect(digest?.dropped[0]?.pct).toBe(-20)
    expect(digest?.rose.map(c => c.productId)).toEqual(['c'])
    expect(weeklyDigestSummary(digest!)).toBe('2 bajaron de precio y 1 subió')
  })

  it('returns null when nothing changed (no empty digests)', () => {
    expect(buildWeeklyDigest([item('a', 1000, 1000), item('b', null, null)])).toBeNull()
    expect(buildWeeklyDigest([])).toBeNull()
  })

  it('words a single change', () => {
    expect(weeklyDigestSummary({ dropped: [], rose: [{ ...item('a', 1100, 1000), current: 1100, weekAgo: 1000, pct: 10 }] })).toBe('1 subió')
  })
})
