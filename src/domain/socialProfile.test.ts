import { describe, expect, it } from 'vitest'
import type { Product, StorePrice } from '../types'
import { closingQuestion, hashtags, isWorthSharing, productType } from './instagram'
import { SOCIAL_PROFILES, currentSocialProfile, englishLine } from './socialProfile'

const offer = (store: string, price: number): StorePrice => ({ store, price, shipping: 'Gratis', available: true } as StorePrice)
const fridge = (price: number): Product => ({
  id: 'n', name: 'Nevera Samsung 14 pies', brand: 'Samsung', model: '', subtitle: '', image: '', rating: 0, reviews: 0,
  category: '', categoryId: '', discount: 0, previousPrice: 0, prices: [offer('Tienda', price)], priceHistory: [],
})

const { DO, CO, MX, US } = SOCIAL_PROFILES

describe('social profiles', () => {
  it('defaults to the Dominican profile outside a country site (tests, server)', () => {
    expect(currentSocialProfile().code).toBe('DO')
  })

  it('scales the sharing threshold to each currency', () => {
    expect(isWorthSharing(1_000, 50_000, DO)).toBe(true)
    // COP$1,000 is pocket change; a gap of COP$70,000 is worth sharing.
    expect(isWorthSharing(1_000, 3_000_000, CO)).toBe(false)
    expect(isWorthSharing(70_000, 3_000_000, CO)).toBe(true)
    // MX$300+ and US$17+.
    expect(isWorthSharing(300, 15_000, MX)).toBe(true)
    expect(isWorthSharing(20, 900, US)).toBe(true)
    expect(isWorthSharing(5, 900, US)).toBe(false)
  })

  it('scales the product-type price floors too', () => {
    expect(productType(fridge(30_000), DO)?.slug).toBe('neveras')
    expect(productType(fridge(30_000), CO)).toBeUndefined() // COP$30,000 is a fraction of a fridge
    expect(productType(fridge(2_000_000), CO)?.slug).toBe('neveras')
    expect(productType(fridge(500), US)?.slug).toBe('neveras')
  })

  it('uses each country\'s own hashtags, five per post', () => {
    expect(hashtags(null, DO)).toBe('#DóndeTa #OfertasRD #SantoDomingo #Electrodomésticos #AhorroRD')
    expect(hashtags(fridge(2_000_000), CO)).toBe('#DóndeTa #OfertasColombia #Bogotá #Neveras #AhorroColombia')
    expect(hashtags(null, MX).split(' ')).toHaveLength(5)
    expect(hashtags(null, US)).toContain('#OfertasUSA')
  })

  it('adds the English question only for the bilingual profile', () => {
    expect(closingQuestion('drop', 'abc', DO)).not.toContain('\n')
    const bilingual = closingQuestion('drop', 'abc', US).split('\n')
    expect(bilingual).toHaveLength(2)
    expect(bilingual[1]).toMatch(/[a-z]/i)
    expect(englishLine(US, 'x')).toEqual(['x'])
    expect(englishLine(CO, 'x')).toEqual([])
  })
})
