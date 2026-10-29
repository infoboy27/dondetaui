import { useEffect, useState } from 'react'
import { cardPromotionsApi } from '../api/cardPromotions'
import { appConfig } from '../config/env'
import type { CardPromotion } from '../domain/cardPromotions'

// One request per page load (the list is small and changes a few times a
// month). A failure just means no card prices: the comparison still works.
let cached: Promise<CardPromotion[]> | null = null

function load(): Promise<CardPromotion[]> {
  cached ??= cardPromotionsApi.active().catch(() => {
    cached = null
    return []
  })
  return cached
}

export function useCardPromotions(): CardPromotion[] {
  const [promotions, setPromotions] = useState<CardPromotion[]>([])
  useEffect(() => {
    if (!appConfig.useApi) return
    let active = true
    load().then(list => { if (active) setPromotions(list) })
    return () => { active = false }
  }, [])
  return promotions
}
