import { describe, expect, it } from 'vitest'
import type { Product } from '../types'
import { OTHER_TYPES_ID, availableTypes, matchesTypeFilter } from './productTypes'

function product(name: string, price: number): Product {
  return {
    id: name, name, brand: '', model: '', subtitle: '', image: '', rating: 0, reviews: 0,
    category: 'Electrodomésticos', categoryId: 'electrodomesticos', discount: 0,
    prices: [{ store: 'Sirena', abbr: 'SI', color: '#000', price, shipping: 'Gratis', available: true, updated: 'hoy' }],
  } as unknown as Product
}

describe('product types filter', () => {
  const fridge = product('Samsung Refrigerador Side by Side RS57', 68_000)
  const fridgeBase = product('Base para nevera ajustable', 1_500)
  const tv = product('Televisor Samsung 55 Pulgadas QLED', 40_000)
  const stove = product('Estufa Frigidaire 30 Pulgadas a Gas', 30_000)
  const fan = product('Abanico de Pie Daiwa 18 Pulgadas', 3_000)
  const combo = product('Lavadora y Secadora Whirlpool 20KG', 70_000)

  it('groups by what the product is, not the retailer category', () => {
    expect(matchesTypeFilter(fridge, 'tipo:neveras')).toBe(true)
    expect(matchesTypeFilter(tv, 'tipo:televisores')).toBe(true)
    expect(matchesTypeFilter(combo, 'tipo:centros-de-lavado')).toBe(true)
    expect(matchesTypeFilter(combo, 'tipo:lavadoras')).toBe(false)
  })

  it('does not call stoves or fans "televisores" because of "pulgadas"', () => {
    expect(matchesTypeFilter(stove, 'tipo:televisores')).toBe(false)
    expect(matchesTypeFilter(stove, 'tipo:estufas')).toBe(true)
    expect(matchesTypeFilter(fan, 'tipo:abanicos')).toBe(true)
    expect(matchesTypeFilter(fan, 'tipo:televisores')).toBe(false)
  })

  it('excludes whole words only', () => {
    expect(matchesTypeFilter(product('Nevera Kitchenaid French Door 30P', 190_000), 'tipo:neveras')).toBe(true)
    expect(matchesTypeFilter(product('Estufa Al Piso Whirlpool, 30", 5 Quemadores Sellados', 40_000), 'tipo:estufas')).toBe(true)
  })

  it('puts accessories in Otros so they stay reachable', () => {
    expect(matchesTypeFilter(fridgeBase, 'tipo:neveras')).toBe(false)
    expect(matchesTypeFilter(fridgeBase, OTHER_TYPES_ID)).toBe(true)
  })

  it('leaves non-type ids to the curated categories', () => {
    expect(matchesTypeFilter(fridge, 'electrodomesticos')).toBeNull()
  })

  it('lists only types present, with counts that add up', () => {
    const products = [fridge, fridgeBase, tv, stove, fan, combo]
    const options = availableTypes(products)
    expect(options.reduce((sum, o) => sum + o.count, 0)).toBe(products.length)
    expect(options.at(-1)).toEqual({ id: OTHER_TYPES_ID, label: 'Otros', count: 1 })
    expect(options.find(o => o.id === 'tipo:microondas')).toBeUndefined()
  })
})
