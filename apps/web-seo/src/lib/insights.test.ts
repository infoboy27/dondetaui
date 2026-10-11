import { describe, expect, it } from 'vitest'
import { PRODUCT_TYPES, matchesType, topComparisons, topDrops, typeStats } from './insights'
import type { Offer, Product } from './types'

const offer = (store: string, price: number, available = true): Offer => ({ store, abbr: store.slice(0, 2), color: '#000', price, shipping: 'Gratis', available })
const product = (name: string, prices: Offer[], history: { date: string; price: number }[] = []): Product => ({
  id: name, slug: name, name, brand: '', model: '', subtitle: '', image: '', rating: 0, reviews: 0, category: '', categoryId: '', prices, priceHistory: history,
})
const type = (slug: string) => PRODUCT_TYPES.find(t => t.slug === slug)!

describe('matchesType', () => {
  it('matches the appliance, not its accessories or cheap parts', () => {
    expect(matchesType(product('Nevera Samsung 14 pies', [offer('Jumbo', 30_000)]), type('neveras'))).toBe(true)
    expect(matchesType(product('Base para nevera ajustable', [offer('Jumbo', 2_500)]), type('neveras'))).toBe(false)
    expect(matchesType(product('Vaso para licuadora Oster', [offer('Sirena', 600)]), type('licuadoras'))).toBe(false)
    expect(matchesType(product('Refrigerador Side by Side LG', [offer('PriceSmart', 80_000)]), type('neveras'))).toBe(true)
  })

  it('ignores accents and case', () => {
    expect(matchesType(product('ESTUFA ELÉCTRICA Frigidaire 30"', [offer('Jumbo', 20_000)]), type('estufas'))).toBe(true)
  })
})

describe('comparisons, drops and stats', () => {
  const a = product('Nevera A', [offer('Jumbo', 30_000), offer('Sirena', 36_000)])
  const b = product('Nevera B', [offer('Jumbo', 50_000), offer('Corripio', 51_000)], [{ date: '2026-10-01', price: 60_000 }, { date: '2026-10-02', price: 50_000 }])
  const c = product('Nevera C', [offer('Sirena', 20_000)])

  it('ranks comparisons by saving', () => {
    expect(topComparisons([a, b, c]).map(x => [x.product.name, x.savings, x.cheapest])).toEqual([['Nevera A', 6_000, 'Jumbo'], ['Nevera B', 1_000, 'Jumbo']])
  })

  it('finds real drops from the price history', () => {
    expect(topDrops([a, b, c])).toMatchObject([{ product: { name: 'Nevera B' }, pct: 17, oldPrice: 60_000, newPrice: 50_000 }])
  })

  it('summarizes a type', () => {
    expect(typeStats([a, b, c])).toMatchObject({ count: 3, min: 20_000, max: 50_000, median: 30_000, compared: 2, stores: 3 })
  })
})
