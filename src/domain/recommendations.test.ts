import { describe, expect, it } from 'vitest'
import type { Product } from '../types'
import { rankProducts, type RecommendationEvent } from './recommendations'

function product(overrides: Partial<Product>): Product {
  return {
    id: 'p1',
    name: 'Producto',
    brand: 'Marca',
    model: 'M1',
    subtitle: '',
    image: '',
    rating: 4.5,
    reviews: 10,
    category: 'Electrónica',
    categoryId: 'electronics',
    discount: 10,
    previousPrice: 1000,
    prices: [{ store: 'Tienda', abbr: 'T', color: '#000', price: 800, shipping: 'Gratis', available: true }],
    priceHistory: [],
    ...overrides,
  }
}

describe('rankProducts', () => {
  it('raises products that match learned category and brand affinity', () => {
    const preferred = product({ id: 'preferred', brand: 'Apple', categoryId: 'phones' })
    const other = product({ id: 'other', brand: 'Other', categoryId: 'home' })
    const events: RecommendationEvent[] = [
      { productId: 'x', categoryId: 'phones', brand: 'Apple', type: 'favorite', at: new Date().toISOString() },
      { productId: 'y', categoryId: 'phones', brand: 'Apple', type: 'alert', at: new Date().toISOString() },
    ]

    const ranked = rankProducts([other, preferred], events)
    expect(ranked[0].product.id).toBe('preferred')
    expect(ranked[0].factors.affinity).toBeGreaterThan(ranked[1].factors.affinity)
  })

  it('excludes products hidden by the user', () => {
    const hidden = product({ id: 'hidden' })
    const visible = product({ id: 'visible' })
    const events: RecommendationEvent[] = [
      { productId: 'hidden', categoryId: hidden.categoryId, brand: hidden.brand, type: 'hide', at: new Date().toISOString() },
    ]

    expect(rankProducts([hidden, visible], events).map(item => item.product.id)).toEqual(['visible'])
  })

  it('re-enables a hidden product after a later positive interaction', () => {
    const item = product({ id: 'item' })
    const events: RecommendationEvent[] = [
      { productId: 'item', categoryId: item.categoryId, brand: item.brand, type: 'hide', at: '2026-01-01T00:00:00Z' },
      { productId: 'item', categoryId: item.categoryId, brand: item.brand, type: 'favorite', at: '2026-01-02T00:00:00Z' },
    ]

    expect(rankProducts([item], events)).toHaveLength(1)
  })
})
