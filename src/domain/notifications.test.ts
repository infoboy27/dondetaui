import { describe, expect, it } from 'vitest'
import { getPriceDropNotifications, getTopPriceDrops } from './notifications'
import type { Product } from '../types'

// The current offer defaults to the latest history point, as in real data.
function product(id: string, priceHistory: { date: string; price: number }[], currentPrice = priceHistory.at(-1)?.price): Product {
  return {
    id,
    name: `Product ${id}`,
    brand: 'Brand',
    model: 'Model',
    subtitle: 'Subtitle',
    image: '',
    rating: 4.5,
    reviews: 10,
    category: 'Electrodomésticos',
    categoryId: 'electrodomesticos',
    discount: 0,
    previousPrice: 0,
    prices: currentPrice === undefined ? [] : [{ store: 'Store', abbr: 'ST', color: '#000', price: currentPrice, shipping: 'Gratis', available: true, updated: 'hoy' }],
    priceHistory,
  }
}

describe('getTopPriceDrops sanity check', () => {
  it('ignores a drop the current offers do not show (stale or merged listing)', () => {
    // History says 3,695 -> 899, but the only offer shown is still 3,695.
    const p = product('combo', [{ date: '2026-10-10', price: 3695 }, { date: '2026-10-14', price: 899 }], 3695)
    expect(getTopPriceDrops([p])).toEqual([])
  })

  it('keeps a drop that matches the cheapest current offer', () => {
    const p = product('real', [{ date: '2026-10-10', price: 1000 }, { date: '2026-10-14', price: 800 }], 800)
    expect(getTopPriceDrops([p]).map(d => d.pct)).toEqual([20])
  })
})

describe('getPriceDropNotifications', () => {
  it('ignores products the user has not alerted', () => {
    const p = product('a', [{ date: '2026-01-01', price: 100 }, { date: '2026-01-05', price: 50 }])
    const notifications = getPriceDropNotifications([p], new Set())
    expect(notifications).toEqual([])
  })

  it('ignores alerted products with fewer than two price-history points', () => {
    const p = product('a', [{ date: '2026-01-01', price: 100 }])
    const notifications = getPriceDropNotifications([p], new Set(['a']))
    expect(notifications).toEqual([])
  })

  it('ignores alerted products whose price did not drop', () => {
    const p = product('a', [{ date: '2026-01-01', price: 100 }, { date: '2026-01-05', price: 100 }])
    expect(getPriceDropNotifications([p], new Set(['a']))).toEqual([])

    const rose = product('b', [{ date: '2026-01-01', price: 100 }, { date: '2026-01-05', price: 120 }])
    expect(getPriceDropNotifications([rose], new Set(['b']))).toEqual([])
  })

  it('reports a drop between the two most recent price-history points, with a rounded percentage', () => {
    const p = product('a', [
      { date: '2026-01-01', price: 200 },
      { date: '2026-01-05', price: 1000 },
      { date: '2026-01-08', price: 750 },
    ])

    const notifications = getPriceDropNotifications([p], new Set(['a']))

    expect(notifications).toHaveLength(1)
    expect(notifications[0]).toMatchObject({
      oldPrice: 1000,
      newPrice: 750,
      pct: 25,
      date: '2026-01-08',
    })
  })

  it('sorts multiple drops by percentage descending', () => {
    const smallDrop = product('small', [{ date: '2026-01-01', price: 100 }, { date: '2026-01-05', price: 90 }]) // -10%
    const bigDrop = product('big', [{ date: '2026-01-01', price: 100 }, { date: '2026-01-05', price: 50 }]) // -50%

    const notifications = getPriceDropNotifications([smallDrop, bigDrop], new Set(['small', 'big']))

    expect(notifications.map(n => n.product.id)).toEqual(['big', 'small'])
  })
})

describe('getTopPriceDrops', () => {
  it('lists real drops across the catalog, biggest first, ignoring tiny ones', () => {
    const products = [
      product('small', [{ date: '2026-10-01', price: 1000 }, { date: '2026-10-05', price: 990 }]),
      product('big', [{ date: '2026-10-01', price: 1000 }, { date: '2026-10-05', price: 700 }]),
      product('mid', [{ date: '2026-10-01', price: 1000 }, { date: '2026-10-05', price: 900 }]),
      product('up', [{ date: '2026-10-01', price: 1000 }, { date: '2026-10-05', price: 1100 }]),
    ]
    expect(getTopPriceDrops(products).map(d => d.product.id)).toEqual(['big', 'mid'])
  })
})

describe('short-lived "before" prices', () => {
  it('ignores a wrong price the store fixed within MIN_DROP_HELD_DAYS', () => {
    // Plaza Lama, 2026-11-25..27: RD$99,995 by mistake, then back to RD$14,995.
    const hood = product('hood', [
      { date: '2026-11-20', price: 14995 },
      { date: '2026-11-25', price: 99995 },
      { date: '2026-11-26', price: 99995 },
      { date: '2026-11-27', price: 14995 },
    ])
    expect(getTopPriceDrops([hood])).toEqual([])
  })
})
