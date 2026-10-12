import { describe, expect, it } from 'vitest'
import { gamingKind, gamingShowcase, isGaming } from './gaming'
import { compareByRelevance } from './offers'
import type { Product } from '../types'

const product = (name: string, price: number, categoryId = 'gaming'): Product => ({
  id: name, name, categoryId, prices: [{ store: 'Eneba', price }],
} as unknown as Product)

describe('gaming', () => {
  it('tells top-ups, subscriptions and PC games apart', () => {
    expect(gamingKind(product('Free Fire 100 diamantes', 77))).toBe('Recarga')
    expect(gamingKind(product('Xbox Game Pass para PC (1 mes)', 766))).toBe('Suscripción')
    expect(gamingKind(product('Hogwarts Legacy (PC, Steam)', 338))).toBe('Juego PC')
    expect(gamingKind(product('EA SPORTS FC 26 1,050 FC Points (PC)', 566))).toBe('Recarga')
  })

  it('leads with the popular top-ups, then games cheapest first, gaming only', () => {
    const list = gamingShowcase([
      product('Red Dead Redemption 2 (PC, Rockstar)', 720),
      product('Roblox 800 Robux', 556),
      product('Roblox 4,500 Robux', 3052),
      product('Hogwarts Legacy (PC, Steam)', 338),
      product('Free Fire 100 diamantes', 77),
      product('Nevera Samsung', 30000, 'neveras'),
    ])
    expect(list.map(p => p.name)).toEqual([
      'Free Fire 100 diamantes',
      'Roblox 800 Robux',
      'Hogwarts Legacy (PC, Steam)',
      'Red Dead Redemption 2 (PC, Rockstar)',
    ])
    expect(isGaming(product('Nevera', 1, 'neveras'))).toBe(false)
  })

  // Regression: "relevance" sorted Gaming dearest-first, so the section
  // opened with a RD$13,303 Mobile Legends pack.
  it('lists gaming by showcase, then top-ups, subscription and games, cheapest first', () => {
    const list = [
      product('Mobile Legends 12,000 diamantes', 13303),
      product('Hogwarts Legacy (PC, Steam)', 338),
      product('Xbox Game Pass para PC (1 mes)', 766),
      product('Roblox 800 Robux', 556),
      product('Overwatch 2 200 Coins', 271),
      product('Free Fire 100 diamantes', 77),
    ]
    expect([...list].sort(compareByRelevance).map(p => p.name)).toEqual([
      'Free Fire 100 diamantes',
      'Roblox 800 Robux',
      'Xbox Game Pass para PC (1 mes)',
      'Overwatch 2 200 Coins',
      'Mobile Legends 12,000 diamantes',
      'Hogwarts Legacy (PC, Steam)',
    ])
  })
})
