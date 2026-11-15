import { describe, expect, it } from 'vitest'
import { searchRank, sortBySearchRelevance } from './searchRank'
import type { StorePrice } from '../types'

const offer = (store: string, price: number): StorePrice => ({
  store, abbr: store.slice(0, 2), color: '#000', price, shipping: 'Gratis', available: true, updated: 'hoy',
})

describe('searchRank', () => {
  it('matches plural queries against singular names', () => {
    expect(searchRank('Nevera Samsung 18 pies', 'neveras')).toBe(0)
    expect(searchRank('Bebedero Con Nevera Negro Whirlpool', 'Neveras')).toBe(1)
    expect(searchRank('Bebedero Tecnomaster TY-LWYR33W', 'neveras')).toBe(3)
  })
})

describe('sortBySearchRelevance', () => {
  it('ranks name matches above category-only matches, even with more stores', () => {
    const products = [
      { name: 'Bebedero Tecnomaster TY-LWYR33W', prices: [offer('Plaza Lama', 9000), offer('HI-FI', 9500)] },
      { name: 'Nevera LG 14 pies', prices: [offer('Jumbo', 30000)] },
    ]
    expect(sortBySearchRelevance(products, 'neveras').map(p => p.name)).toEqual([
      'Nevera LG 14 pies',
      'Bebedero Tecnomaster TY-LWYR33W',
    ])
  })

  it('falls back to the listing relevance (store count first) without a query', () => {
    const products = [
      { name: 'Nevera LG 14 pies', prices: [offer('Jumbo', 30000)] },
      { name: 'Bebedero Tecnomaster TY-LWYR33W', prices: [offer('Plaza Lama', 9000), offer('HI-FI', 9500)] },
    ]
    expect(sortBySearchRelevance(products, '').map(p => p.name)).toEqual([
      'Bebedero Tecnomaster TY-LWYR33W',
      'Nevera LG 14 pies',
    ])
  })
})
