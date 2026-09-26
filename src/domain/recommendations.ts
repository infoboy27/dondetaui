import type { Product } from '../types'

export type RecommendationEventType = 'view' | 'open' | 'favorite' | 'hide' | 'alert'

export interface RecommendationEvent {
  productId: string
  categoryId: string
  brand: string
  type: RecommendationEventType
  at: string
}

export interface RankedProduct {
  product: Product
  score: number
  reasons: string[]
  factors: {
    affinity: number
    savings: number
    quality: number
    availability: number
  }
}

const EVENT_WEIGHT: Record<RecommendationEventType, number> = {
  view: 0.08,
  open: 0.35,
  favorite: 1,
  alert: 1.2,
  hide: -1.5,
}

const STORAGE_KEY = 'dondeta.recommendation-events.v1'

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

export function loadRecommendationEvents(): RecommendationEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (!value) return []
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function recordRecommendationEvent(product: Product, type: RecommendationEventType) {
  if (typeof window === 'undefined') return
  const events = loadRecommendationEvents()
  events.push({
    productId: product.id,
    categoryId: product.categoryId,
    brand: product.brand,
    type,
    at: new Date().toISOString(),
  })
  // Keep enough history to learn without letting local storage grow forever.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-500)))
}

export function rankProducts(products: Product[], events: RecommendationEvent[]): RankedProduct[] {
  const categoryAffinity = new Map<string, number>()
  const brandAffinity = new Map<string, number>()
  const hidden = new Set<string>()

  for (const event of events) {
    const weight = EVENT_WEIGHT[event.type]
    categoryAffinity.set(event.categoryId, (categoryAffinity.get(event.categoryId) ?? 0) + weight)
    brandAffinity.set(event.brand, (brandAffinity.get(event.brand) ?? 0) + weight * 0.7)

    if (event.type === 'hide') hidden.add(event.productId)
    if (event.type === 'favorite' || event.type === 'alert' || event.type === 'open') hidden.delete(event.productId)
  }

  const affinityScore = (product: Product) => {
    const raw = (categoryAffinity.get(product.categoryId) ?? 0) + (brandAffinity.get(product.brand) ?? 0)
    return clamp(0.5 + Math.tanh(raw / 4) * 0.5)
  }

  return products
    .filter(product => !hidden.has(product.id))
    .map(product => {
      const availableOffers = product.prices.filter(offer => offer.available)
      const currentBest = availableOffers.length
        ? Math.min(...availableOffers.map(offer => offer.totalPrice ?? offer.price + (offer.shippingCost ?? 0)))
        : product.previousPrice

      const savings = product.previousPrice > 0
        ? clamp((product.previousPrice - currentBest) / product.previousPrice)
        : clamp(product.discount / 100)
      const quality = clamp((product.rating || 0) / 5)
      const availability = clamp(availableOffers.length / Math.max(product.prices.length, 1))
      const affinity = affinityScore(product)

      const score = affinity * 0.4 + savings * 0.28 + quality * 0.2 + availability * 0.12
      const reasons: string[] = []
      if (affinity >= 0.62) reasons.push('Basado en lo que te interesa')
      if (savings >= 0.12) reasons.push('Buen ahorro ahora')
      if (quality >= 0.88) reasons.push('Muy bien valorado')
      if (availableOffers.length >= 2) reasons.push(`Disponible en ${availableOffers.length} tiendas`)
      if (!reasons.length) reasons.push('Recomendación equilibrada')

      return {
        product,
        score: Math.round(score * 100),
        reasons,
        factors: { affinity, savings, quality, availability },
      }
    })
    .sort((a, b) => b.score - a.score)
}
