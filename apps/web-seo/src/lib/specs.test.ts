import { describe, expect, it } from 'vitest'
import { buildSpecRows, similarProducts } from './specs'
import type { Product } from './types'

const make = (id: string, name: string, price: number, specs?: Record<string, string>): Product => ({
  id, slug: id, name, brand: 'X', model: id, subtitle: '', image: '', rating: 0, reviews: 0,
  category: 'Televisores', categoryId: 'tv', specs,
  prices: [{ store: 'S', abbr: 'S', color: '#000', price, shipping: 'Gratis', available: true }],
})

describe('buildSpecRows', () => {
  it('orders by coverage and flags differences', () => {
    const rows = buildSpecRows([
      make('a', 'TV', 1, { Resolución: '4K', 'Smart TV': 'Si', Wifi: 'Si' }),
      make('b', 'TV', 1, { Resolución: 'Full HD', 'Smart TV': 'si' }),
    ])
    expect(rows.map(r => r.label)).toEqual(['Resolución', 'Smart TV', 'Wifi'])
    expect(rows[0]).toMatchObject({ differs: true, values: ['4K', 'Full HD'] })
    expect(rows[1].differs).toBe(false) // same value, different case
    expect(rows[2]).toMatchObject({ differs: false, values: ['Si', null] })
  })

  it('is empty when nothing has specs', () => {
    expect(buildSpecRows([make('a', 'TV', 1), make('b', 'TV', 1)])).toEqual([])
  })
})

describe('similarProducts', () => {
  const tv = make('a', 'Televisor 55 pulgadas', 30000, { Resolución: '4K' })
  it('returns same-kind products with specs, nearest price first', () => {
    const catalog = [
      tv,
      make('far', 'Televisor 75 pulgadas', 90000, { Resolución: '4K' }),
      make('near', 'Televisor 50 pulgadas', 28000, { Resolución: '4K' }),
      make('nospecs', 'Televisor 43 pulgadas', 29000),
      make('fridge', 'Nevera 14 pies', 29500, { Puertas: '2' }),
    ]
    expect(similarProducts(tv, catalog).map(p => p.id)).toEqual(['near', 'far'])
  })

  it('returns nothing when the product itself has no specs', () => {
    expect(similarProducts(make('a', 'Televisor 55 pulgadas', 1), [make('b', 'Televisor 50 pulgadas', 1, { Resolución: '4K' })])).toEqual([])
  })
})
