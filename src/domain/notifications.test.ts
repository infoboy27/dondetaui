import { describe, expect, it } from 'vitest'
import { getPriceDropNotifications } from './notifications'
import type { Product } from '../types'

function product(id: string, priceHistory: { date: string; price: number }[]): Product {
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
    prices: [],
    priceHistory,
  }
}

describe('getPriceDropNotifications', () => {
  it('ignores products the user has not alerted', () => {
    const p = product('a', [{ date: '2026-01-01', price: 100 }, { date: '2026-01-02', price: 50 }])
    const notifications = getPriceDropNotifications([p], new Set())
    expect(notifications).toEqual([])
  })

  it('ignores alerted products with fewer than two price-history points', () => {
    const p = product('a', [{ date: '2026-01-01', price: 100 }])
    const notifications = getPriceDropNotifications([p], new Set(['a']))
    expect(notifications).toEqual([])
  })

  it('ignores alerted products whose price did not drop', () => {
    const p = product('a', [{ date: '2026-01-01', price: 100 }, { date: '2026-01-02', price: 100 }])
    expect(getPriceDropNotifications([p], new Set(['a']))).toEqual([])

    const rose = product('b', [{ date: '2026-01-01', price: 100 }, { date: '2026-01-02', price: 120 }])
    expect(getPriceDropNotifications([rose], new Set(['b']))).toEqual([])
  })

  it('reports a drop between the two most recent price-history points, with a rounded percentage', () => {
    const p = product('a', [
      { date: '2026-01-01', price: 200 },
      { date: '2026-01-02', price: 1000 },
      { date: '2026-01-03', price: 750 },
    ])

    const notifications = getPriceDropNotifications([p], new Set(['a']))

    expect(notifications).toHaveLength(1)
    expect(notifications[0]).toMatchObject({
      oldPrice: 1000,
      newPrice: 750,
      pct: 25,
      date: '2026-01-03',
    })
  })

  it('sorts multiple drops by percentage descending', () => {
    const smallDrop = product('small', [{ date: '2026-01-01', price: 100 }, { date: '2026-01-02', price: 90 }]) // -10%
    const bigDrop = product('big', [{ date: '2026-01-01', price: 100 }, { date: '2026-01-02', price: 50 }]) // -50%

    const notifications = getPriceDropNotifications([smallDrop, bigDrop], new Set(['small', 'big']))

    expect(notifications.map(n => n.product.id)).toEqual(['big', 'small'])
  })
})
