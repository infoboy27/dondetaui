import { describe, expect, it } from 'vitest'
import { getBestOffer, getHighestAvailableOffer, getOfferTotal, getSavingsRange, rankOffers } from './offers'
import type { StorePrice } from '../types'

function offer(overrides: Partial<StorePrice>): StorePrice {
  return {
    store: 'Plaza Lama',
    abbr: 'PL',
    color: '#C0392B',
    price: 1000,
    shipping: 'Gratis',
    available: true,
    updated: '1 hora',
    ...overrides,
  }
}

describe('getOfferTotal', () => {
  it('adds parsed shipping cost to price when shippingCost is not set', () => {
    const total = getOfferTotal(offer({ price: 1000, shipping: 'RD$500' }))
    expect(total).toBe(1500)
  })

  it('treats "Gratis" shipping as zero cost', () => {
    expect(getOfferTotal(offer({ price: 1000, shipping: 'Gratis' }))).toBe(1000)
  })

  it('prefers the explicit totalPrice field over price + parsed shipping', () => {
    const total = getOfferTotal(offer({ price: 1000, shipping: 'RD$500', totalPrice: 1200 }))
    expect(total).toBe(1200)
  })
})

describe('rankOffers', () => {
  it('sorts unavailable offers after available ones regardless of price', () => {
    const cheaperButUnavailable = offer({ store: 'Sirena', price: 100, available: false })
    const pricierButAvailable = offer({ store: 'Corripio', price: 900, available: true })

    const ranked = rankOffers([cheaperButUnavailable, pricierButAvailable])

    expect(ranked.map(o => o.store)).toEqual(['Corripio', 'Sirena'])
  })

  it('sorts available offers by total price (price + shipping) ascending', () => {
    const cheaperWithShipping = offer({ store: 'Jumbo', price: 900, shipping: 'RD$200' }) // total 1100
    const pricierFreeShipping = offer({ store: 'PriceSmart', price: 1000, shipping: 'Gratis' }) // total 1000

    const ranked = rankOffers([cheaperWithShipping, pricierFreeShipping])

    expect(ranked.map(o => o.store)).toEqual(['PriceSmart', 'Jumbo'])
  })
})

describe('getBestOffer', () => {
  it('returns undefined for an empty offer list', () => {
    expect(getBestOffer([])).toBeUndefined()
  })

  it('returns the lowest-total available offer', () => {
    const best = getBestOffer([
      offer({ store: 'Jumbo', price: 2000 }),
      offer({ store: 'Sirena', price: 1000 }),
    ])
    expect(best?.store).toBe('Sirena')
  })
})

describe('getHighestAvailableOffer', () => {
  it('returns undefined when no offers are available', () => {
    expect(getHighestAvailableOffer([offer({ available: false })])).toBeUndefined()
  })

  it('ignores unavailable offers even if they would otherwise be the highest', () => {
    const highest = getHighestAvailableOffer([
      offer({ store: 'Jumbo', price: 5000, available: false }),
      offer({ store: 'Sirena', price: 2000, available: true }),
    ])
    expect(highest?.store).toBe('Sirena')
  })
})

describe('getSavingsRange', () => {
  it('is zero when there is only one offer', () => {
    expect(getSavingsRange([offer({ price: 1000 })])).toBe(0)
  })

  it('is the gap between the highest available and the best offer', () => {
    const savings = getSavingsRange([
      offer({ store: 'Jumbo', price: 3000 }),
      offer({ store: 'Sirena', price: 1000 }),
    ])
    expect(savings).toBe(2000)
  })
})
