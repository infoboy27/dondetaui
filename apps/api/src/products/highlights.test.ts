import { describe, expect, it } from 'vitest'
import { homeHighlights } from './highlights'
import type { ProductDto } from './products.types'

const product = (id: string, stores: string[], history: number[]): ProductDto => ({
  id, prices: stores.map(store => ({ store, price: 100 })),
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
})
