import { describe, expect, it } from 'vitest'
import type { Product, StorePrice } from '../types'
import { closingQuestion, hashtags, isWorthSharing, weekIndex, weeklyTop } from './instagram'

const offer = (store: string, price: number, available = true): StorePrice => ({ store, price, shipping: 'Gratis', available } as StorePrice)
const product = (id: string, name: string, brand: string, price: number, available = true): Product => ({
  id, name, brand, model: '', subtitle: '', image: '', rating: 0, reviews: 0, category: '', categoryId: '', discount: 0, previousPrice: 0,
  prices: [offer('Jumbo', price, available)], priceHistory: [],
})

describe('isWorthSharing', () => {
  it('shares big gaps, and proportionally big ones on cheap items', () => {
    expect(isWorthSharing(26_600, 90_000)).toBe(true)
    expect(isWorthSharing(400, 3_000)).toBe(true)
  })

  it('skips gaps nobody would notice', () => {
    expect(isWorthSharing(0, 2_000)).toBe(false)
    expect(isWorthSharing(100, 1_500)).toBe(false)
    expect(isWorthSharing(900, 40_000)).toBe(false)
  })
})

describe('hashtags', () => {
  it('uses the product type hashtag, keeping it to five', () => {
    const tags = hashtags(product('n', 'Nevera Samsung 14 pies', 'Samsung', 30_000))
    expect(tags).toContain('#Neveras')
    expect(tags.split(' ')).toHaveLength(5)
    expect(hashtags(null)).toContain('#Electrodomésticos')
  })
})

describe('closingQuestion', () => {
  it('is stable for the same product', () => {
    expect(closingQuestion('comparison', 'abc')).toBe(closingQuestion('comparison', 'abc'))
  })
})

describe('weeklyTop', () => {
  const fridges = [
    product('a', 'Nevera A 10 pies', 'Mabe', 20_000),
    product('b', 'Nevera B 12 pies', 'Mabe', 21_000), // same brand as a: skipped
    product('c', 'Nevera C', 'LG', 25_000),
    product('d', 'Nevera D', 'Samsung', 30_000),
    product('e', 'Nevera E', 'Haier', 35_000),
    product('f', 'Nevera F', 'Frigidaire', 40_000),
    product('g', 'Nevera G', 'Whirlpool', 45_000),
    product('h', 'Nevera agotada', 'Midea', 10_000, false),
    product('i', 'Base para nevera', 'Genérica', 9_000),
  ]

  it('picks the five cheapest in-stock models, one per brand', () => {
    const top = weeklyTop(fridges, 0)
    expect(top?.type.slug).toBe('neveras')
    expect(top?.items.map(p => p.id)).toEqual(['a', 'c', 'd', 'e', 'f'])
  })

  it('skips a type without five models and moves to the next one', () => {
    // Week 1 is televisores: none here, so it rotates on until neveras again.
    expect(weeklyTop(fridges, 1)?.type.slug).toBe('neveras')
    expect(weeklyTop(fridges.slice(0, 3), 0)).toBeNull()
  })

  it('rotates weekly', () => {
    expect(weekIndex(new Date('2026-01-05T12:00:00Z'))).toBe(0)
    expect(weekIndex(new Date('2026-01-12T12:00:00Z'))).toBe(1)
  })
})
