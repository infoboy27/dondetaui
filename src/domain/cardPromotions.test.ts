import { describe, expect, it } from 'vitest'
import { bestCardDeal, bestCardDealAcross, cardDealConditions, dominicanWeekday, weekdaysLabel, type CardPromotion } from './cardPromotions'
import type { StorePrice } from '../types'

function offer(overrides: Partial<StorePrice> = {}): StorePrice {
  return { store: 'Plaza Lama', abbr: 'PL', color: '#C0392B', price: 20000, shipping: 'Gratis', available: true, updated: '1 hora', retailerId: 'pl', ...overrides }
}

function promo(overrides: Partial<CardPromotion> = {}): CardPromotion {
  return {
    id: '1', retailerId: 'pl', retailerSlug: 'plaza-lama', store: 'Plaza Lama', bank: 'BHD', card: null,
    percent: 10, maxDiscount: null, minPurchase: 0, weekdays: null, startsOn: '2026-10-01', endsOn: '2026-10-31',
    termsUrl: null, note: null, ...overrides,
  }
}

describe('bestCardDeal', () => {
  it('subtracts the percentage from the purchase total', () => {
    const deal = bestCardDeal(offer({ shipping: 'RD$500' }), [promo()], 2)
    expect(deal?.discount).toBe(2000)
    expect(deal?.total).toBe(18500)
  })

  it('rounds the card price to whole pesos', () => {
    expect(bestCardDeal(offer({ price: 2954.72 }), [promo({ percent: 6 })], 2)?.total).toBe(2778)
  })

  it('caps the discount at the bank maximum', () => {
    expect(bestCardDeal(offer(), [promo({ maxDiscount: 1500 })], 2)?.discount).toBe(1500)
  })

  it('picks the biggest discount among several cards', () => {
    const deal = bestCardDeal(offer(), [promo({ id: 'a', percent: 10 }), promo({ id: 'b', percent: 15, bank: 'Popular' })], 2)
    expect(deal?.promotion.bank).toBe('Popular')
  })

  it('ignores other stores, other weekdays, the minimum purchase and sold-out offers', () => {
    expect(bestCardDeal(offer(), [promo({ retailerId: 'si' })], 2)).toBeUndefined()
    expect(bestCardDeal(offer(), [promo({ weekdays: [2] })], 3)).toBeUndefined()
    expect(bestCardDeal(offer(), [promo({ weekdays: [2] })], 2)).toBeDefined()
    expect(bestCardDeal(offer(), [promo({ minPurchase: 25000 })], 2)).toBeUndefined()
    expect(bestCardDeal(offer({ available: false }), [promo()], 2)).toBeUndefined()
  })

  it('matches by store name when the offer has no retailer id', () => {
    expect(bestCardDeal(offer({ retailerId: undefined }), [promo()], 2)).toBeDefined()
  })
})

describe('bestCardDealAcross', () => {
  it('returns the lowest total with a card across stores', () => {
    const offers = [offer(), offer({ store: 'Sirena', retailerId: 'si', price: 19000 })]
    const best = bestCardDealAcross(offers, [promo({ percent: 20 }), promo({ id: '2', retailerId: 'si', store: 'Sirena', percent: 5 })], 2)
    expect(best?.offer.store).toBe('Plaza Lama')
    expect(best?.total).toBe(16000)
  })
})

describe('labels', () => {
  it('describes the weekdays', () => {
    expect(weekdaysLabel(null)).toBeNull()
    expect(weekdaysLabel([2])).toBe('solo martes')
    expect(weekdaysLabel([2, 4])).toBe('martes y jueves')
  })

  it('joins the conditions', () => {
    expect(cardDealConditions(promo({ maxDiscount: 5000, weekdays: [2] }))).toBe('tope RD$5,000 · solo martes')
  })

  it('uses the Dominican weekday', () => {
    // Wednesday 02:00 UTC is still Tuesday in Santo Domingo.
    expect(dominicanWeekday(new Date('2026-10-28T02:00:00Z'))).toBe(2)
  })
})
