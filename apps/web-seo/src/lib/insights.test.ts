import { describe, expect, it } from 'vitest'
import { PRODUCT_TYPES, describeMarketPosition, marketPosition, matchesType, topComparisons, topDrops, typeStats } from './insights'
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

  it('excludes whole words only (KitchenAid is not a "kit", quemadores are not a spare "quemador")', () => {
    expect(matchesType(product('Nevera Kitchenaid French Door 30P KRFF436SPS', [offer('Sirena', 190_000)]), type('neveras'))).toBe(true)
    expect(matchesType(product('Estufa Al Piso Whirlpool, 30", 5 Quemadores Sellados, A Gas', [offer('Corripio', 40_000)]), type('estufas'))).toBe(true)
    expect(matchesType(product('Kit de Instalación para Lavadora Whirlpool', [offer('Jumbo', 8_000)]), type('lavadoras'))).toBe(false)
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

describe('marketPosition', () => {
  const fridge = (n: number, price: number, brand = 'Samsung') => ({ ...product(`Nevera ${brand} ${n}`, [offer('Jumbo', price)]), brand })
  const catalog = [10, 20, 30, 40, 50, 60, 70, 80, 90].map((k, i) => fridge(i, k * 1_000, i < 4 ? 'Samsung' : 'LG'))

  it('places a product against the median of its type and brand', () => {
    const position = marketPosition(catalog[1]!, catalog)!
    expect(position.type.slug).toBe('neveras')
    expect(position.peers).toBe(9)
    expect(position.median).toBe(50_000)
    expect(position.pctVsMedian).toBe(-60)
    expect(position.cheaperCount).toBe(1)
    expect(position.brandMedian).toBe(30_000)
    expect(describeMarketPosition(position, 'Samsung', n => `RD$${n}`).join(' ')).toContain('60% por debajo de la mediana')
  })

  it('says nothing for unknown types or tiny groups', () => {
    expect(marketPosition(product('Silla de oficina', [offer('Jumbo', 9_000)]), catalog)).toBeNull()
    expect(marketPosition(catalog[0]!, catalog.slice(0, 5))).toBeNull()
  })
})
