// Mirrors src/domain/offers.ts's getOfferTotal/getBestOffer. AGENTS.md is
// explicit that listed price isn't always total purchase cost — reuse the
// same ranking logic here instead of re-deriving it differently.
import type { Offer } from './types'

function parseShippingCost(label: string): number {
  const normalized = label.trim().toLowerCase()
  if (!normalized || normalized.includes('gratis') || normalized.includes('free')) return 0

  const numeric = normalized.replace(/[^0-9.]/g, '')
  const parsed = Number(numeric)
  return Number.isFinite(parsed) ? parsed : 0
}

function getShippingCost(offer: Offer): number {
  if (typeof offer.shippingCost === 'number' && Number.isFinite(offer.shippingCost)) {
    return offer.shippingCost
  }
  return parseShippingCost(offer.shipping)
}

export function getOfferTotal(offer: Offer): number {
  if (typeof offer.totalPrice === 'number' && Number.isFinite(offer.totalPrice)) {
    return offer.totalPrice
  }
  return offer.price + getShippingCost(offer)
}

export function rankOffers(offers: Offer[]): Offer[] {
  return [...offers].sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1
    return getOfferTotal(a) - getOfferTotal(b)
  })
}

export function getBestOffer(offers: Offer[]): Offer | undefined {
  return rankOffers(offers)[0]
}
