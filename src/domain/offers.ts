import type { StorePrice } from '../types'

function parseShippingCost(label: string): number {
  const normalized = label.trim().toLowerCase()

  if (!normalized || normalized.includes('gratis') || normalized.includes('free')) {
    return 0
  }

  const numeric = normalized.replace(/[^0-9.]/g, '')
  const parsed = Number(numeric)

  return Number.isFinite(parsed) ? parsed : 0
}

export function getOfferTotal(offer: StorePrice): number {
  return offer.price + parseShippingCost(offer.shipping)
}

export function rankOffers(offers: StorePrice[]): StorePrice[] {
  return [...offers].sort((a, b) => {
    if (a.available !== b.available) {
      return a.available ? -1 : 1
    }

    return getOfferTotal(a) - getOfferTotal(b)
  })
}

export function getBestOffer(offers: StorePrice[]): StorePrice | undefined {
  return rankOffers(offers)[0]
}

export function getHighestAvailableOffer(offers: StorePrice[]): StorePrice | undefined {
  const available = offers.filter(offer => offer.available)
  if (!available.length) return undefined

  return [...available].sort((a, b) => getOfferTotal(b) - getOfferTotal(a))[0]
}

export function getSavingsRange(offers: StorePrice[]): number {
  const best = getBestOffer(offers)
  const highest = getHighestAvailableOffer(offers)

  if (!best || !highest) return 0

  return Math.max(0, getOfferTotal(highest) - getOfferTotal(best))
}
