import { describe, expect, it } from 'vitest'
import { homeHighlights } from './highlights'
import type { ProductDto } from './products.types'

const product = (id: string, stores: string[], history: number[], categoryId = 'neveras'): ProductDto => ({
  id, categoryId, prices: stores.map(store => ({ store, price: 100 })),
  priceHistory: history.map((price, i) => ({ date: `2026-10-0${i + 1}`, price })),
} as unknown as ProductDto)

describe('homeHighlights', () => {
  it('keeps multi-store products and products whose price moved', () => {
    const result = homeHighlights([
      product('compared', ['Jumbo', 'Sirena'], [100]),
      product('dropped', ['Jumbo'], [120, 100]),
      product('flat', ['Sirena'], [100, 100]),
      product('single', ['Plaza Lama'], []),
    ])
    expect(result.products.map(p => p.id)).toEqual(['compared', 'dropped'])
    expect(result.total).toBe(4)
    expect(result.stores).toBe(3)
  })

  it('puts gaming in its own list, out of the comparison strips and counts', () => {
    const result = homeHighlights([
      product('nevera', ['Jumbo', 'Sirena'], [100]),
      product('robux', ['Eneba'], [600, 555], 'gaming'),
    ])
    expect(result.products.map(p => p.id)).toEqual(['nevera'])
    expect(result.gaming.map(p => p.id)).toEqual(['robux'])
    expect(result.total).toBe(1)
    expect(result.stores).toBe(2)
  })
})
