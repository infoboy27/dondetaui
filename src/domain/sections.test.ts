import { describe, expect, it } from 'vitest'
import { matchesSectionFilter, sectionFilters } from './sections'
import type { Product } from '../types'

const product = (name: string, price: number, categoryId = 'electrodomesticos'): Product => ({
  id: name, name, categoryId, category: categoryId, prices: [{ store: 'Jumbo', price, shipping: 'Gratis', available: true }],
} as unknown as Product)

describe('section filters', () => {
  it('splits Gaming into top-ups, subscriptions and PC games, only those present', () => {
    const gaming = [
      product('Free Fire 100 diamantes', 77, 'gaming'),
      product('Roblox 800 Robux', 556, 'gaming'),
      product('Hogwarts Legacy (PC, Steam)', 338, 'gaming'),
    ]
    expect(sectionFilters('gaming', gaming)).toEqual([
      { id: 'kind:Recarga', label: 'Recargas', count: 2 },
      { id: 'kind:Juego PC', label: 'Juegos PC', count: 1 },
    ])
    expect(gaming.filter(p => matchesSectionFilter(p, 'kind:Juego PC')).map(p => p.name)).toEqual(['Hogwarts Legacy (PC, Steam)'])
  })

  it('uses the most common product types elsewhere, never "Otros"', () => {
    const list = [
      product('Nevera Samsung 18 pies', 30000),
      product('Nevera LG 14 pies', 25000),
      product('Lavadora Whirlpool 18kg', 22000),
      product('Cosa rara sin tipo', 900),
    ]
    const filters = sectionFilters('electrodomesticos', list)
    expect(filters.map(f => [f.label, f.count])).toEqual([['Neveras y refrigeradores', 2], ['Lavadoras', 1]])
    expect(list.filter(p => matchesSectionFilter(p, filters[1].id)).map(p => p.name)).toEqual(['Lavadora Whirlpool 18kg'])
    expect(matchesSectionFilter(list[3], null)).toBe(true)
  })
})
