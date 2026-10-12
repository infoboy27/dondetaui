import { describe, expect, it } from 'vitest'
import type { Product } from '../types'
import { gamingKind, gamingShowcase } from './gaming'
import { getTopPriceDrops } from './notifications'
import { compareByRelevance } from './offers'

// Runs in the root vitest suite (pnpm test): pure domain code only, no RN.
function product(name: string, price: number, categoryId = 'gaming', history: number[] = []): Product {
  return {
    id: name, name, brand: '', model: '', subtitle: '', image: '', rating: 0, reviews: 0,
    category: categoryId, categoryId, discount: 0, previousPrice: 0,
    prices: [{ store: 'Eneba', abbr: 'EN', color: '#000', price, shipping: 'Gratis', available: true, updated: '' }],
    priceHistory: history.map((value, i) => ({ date: `2026-10-0${i + 1}`, price: value })),
  }
}

describe('mobile gaming', () => {
  it('orders gaming like the web: showcase top-ups first, not dearest first', () => {
    const pack = product('Free Fire 5600 diamantes', 13000)
    const lead = product('Free Fire 100 diamantes', 60)
    const game = product('Hogwarts Legacy (PC, Steam)', 900)
    const sorted = [pack, game, lead].sort(compareByRelevance)
    expect(sorted.map(p => p.name)).toEqual(['Free Fire 100 diamantes', 'Free Fire 5600 diamantes', 'Hogwarts Legacy (PC, Steam)'])
  })

  it('keeps gaming out of "Bajaron de precio"', () => {
    const gamingDrop = product('Robux 800', 500, 'gaming', [700, 500])
    const fridgeDrop = product('Nevera', 20000, 'neveras', [25000, 20000])
    expect(getTopPriceDrops([gamingDrop, fridgeDrop]).map(d => d.product.name)).toEqual(['Nevera'])
  })

  it('builds the home showcase from gaming products only', () => {
    const items = [product('Free Fire 100 diamantes', 60), product('Nevera', 20000, 'neveras')]
    expect(gamingShowcase(items).map(p => p.name)).toEqual(['Free Fire 100 diamantes'])
    expect(gamingKind(product('Xbox Game Pass Ultimate 1 mes', 900))).toBe('Suscripción')
  })
})
