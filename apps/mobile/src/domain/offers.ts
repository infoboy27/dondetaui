import type { StorePrice } from '../types'
import { GAMING_CATEGORY, compareGaming } from './gaming'

function parseShippingCost(label: string): number {
  const normalized = label.trim().toLowerCase()

  if (!normalized || normalized.includes('gratis') || normalized.includes('free')) {
    return 0
  }

  const numeric = normalized.replace(/[^0-9.]/g, '')
  const parsed = Number(numeric)

  return Number.isFinite(parsed) ? parsed : 0
}

export function getShippingCost(offer: StorePrice): number {
  if (typeof offer.shippingCost === 'number' && Number.isFinite(offer.shippingCost)) {
    return offer.shippingCost
  }

  return parseShippingCost(offer.shipping)
}

export function getOfferTotal(offer: StorePrice): number {
  if (typeof offer.totalPrice === 'number' && Number.isFinite(offer.totalPrice)) {
    return offer.totalPrice
  }

  return offer.price + getShippingCost(offer)
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

// Default listing order: real comparisons first (more distinct stores), then
// by how much the cheapest store saves over the priciest, then dearer items
// first -- so a fridge sold in three stores leads, not a RD$115 blender part.
export function compareByRelevance(
  a: { prices: StorePrice[]; name?: string; categoryId?: string },
  b: { prices: StorePrice[]; name?: string; categoryId?: string },
): number {
  if (a.categoryId === GAMING_CATEGORY && b.categoryId === GAMING_CATEGORY) {
    return compareGaming({ name: a.name ?? '', prices: a.prices }, { name: b.name ?? '', prices: b.prices })
  }
  const stores = (offers: StorePrice[]) => new Set(offers.map(offer => offer.store)).size
  const byStores = stores(b.prices) - stores(a.prices)
  if (byStores) return byStores
  const bySavings = getSavingsRange(b.prices) - getSavingsRange(a.prices)
  if (bySavings) return bySavings
  const total = (offers: StorePrice[]) => {
    const best = getBestOffer(offers)
    return best ? getOfferTotal(best) : 0
  }
  return total(b.prices) - total(a.prices)
}

// "Comparaciones del día": products sold by 2+ stores, biggest saving between
// the cheapest and the priciest store first.
export function getTopComparisons<T extends { prices: StorePrice[] }>(products: T[], limit = 10): Array<{ product: T; savings: number; stores: number }> {
  return products
    .map(product => ({
      product,
      savings: getSavingsRange(product.prices),
      stores: new Set(product.prices.map(offer => offer.store)).size,
    }))
    .filter(entry => entry.stores > 1 && entry.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, limit)
}

