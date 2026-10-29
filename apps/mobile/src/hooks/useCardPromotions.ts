import { useEffect, useState } from 'react'
import { cardPromotionsApi } from '../api/cardPromotions'
import type { CardPromotion } from '../domain/cardPromotions'

// Refetched at most every 30 minutes (the list changes a few times a month,
// but the app can stay open across midnight). A failure just means no card
// prices: the comparison still works.
const MAX_AGE_MS = 30 * 60_000
let cached: { at: number; list: Promise<CardPromotion[]> } | null = null

function load(): Promise<CardPromotion[]> {
  if (!cached || Date.now() - cached.at > MAX_AGE_MS) {
    const list = cardPromotionsApi.active().catch(() => {
      cached = null
      return [] as CardPromotion[]
    })
    cached = { at: Date.now(), list }
  }
  return cached.list
}

export function useCardPromotions(): CardPromotion[] {
  const [promotions, setPromotions] = useState<CardPromotion[]>([])
  useEffect(() => {
    let active = true
    load().then(list => { if (active) setPromotions(list) })
    return () => { active = false }
  }, [])
  return promotions
}
