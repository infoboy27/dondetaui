import { describe, expect, it } from 'vitest'
import { matchesCategory } from './categories'
import type { Product } from '../types'

function product(categoryId: string, category: string): Product {
  return {
    id: '1', name: 'Test', brand: 'Test', model: 'T1', subtitle: '', image: '',
    rating: 0, reviews: 0, categoryId, category, discount: 0, previousPrice: 0,
    prices: [], priceHistory: [],
  }
}

describe('matchesCategory', () => {
  it('matches on exact categoryId equality', () => {
    expect(matchesCategory(product('aires-acondicionados', 'Aires Acondicionados'), 'aires-acondicionados')).toBe(true)
  })

  it('matches a curated bucket via keyword even when categoryId differs and casing/accents differ', () => {
    // The real-world bug this guards against: retailer categories carry
    // accents ("Electrodomésticos") the curated bucket id doesn't
    // ("electrodomesticos") -- a naive substring/equality check misses this.
    expect(matchesCategory(product('electrodomesticos-slug', 'Electrodomésticos'), 'electrodomesticos')).toBe(true)
    expect(matchesCategory(product('neveras', 'Neveras'), 'electrodomesticos')).toBe(true)
  })

  it('matches "aires" against real air-conditioning category names', () => {
    expect(matchesCategory(product('aires-acondicionados', 'Aires Acondicionados'), 'aires')).toBe(true)
    expect(matchesCategory(product('abanicos', 'Abanicos'), 'aires')).toBe(true)
  })

  it('matches "tv-audio" against Televisores/Televisión category names', () => {
    expect(matchesCategory(product('televisores', 'Televisores'), 'tv-audio')).toBe(true)
    expect(matchesCategory(product('television', 'Televisión'), 'tv-audio')).toBe(true)
  })

  it('matches "cocina" against kitchen-appliance category names', () => {
    expect(matchesCategory(product('estufas', 'Estufas'), 'cocina')).toBe(true)
    expect(matchesCategory(product('hornos', 'Hornos, Microondas y Freidoras'), 'cocina')).toBe(true)
  })

  it('does not match an unrelated category', () => {
    expect(matchesCategory(product('neveras', 'Neveras'), 'aires')).toBe(false)
  })

  it('never matches curated buckets with no ingested inventory (hogar, muebles)', () => {
    expect(matchesCategory(product('neveras', 'Neveras'), 'hogar')).toBe(false)
    expect(matchesCategory(product('estufas', 'Estufas'), 'muebles')).toBe(false)
  })
})
