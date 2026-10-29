import type { CardPromotion } from '../domain/cardPromotions'
import { apiFetch } from './http'

export const cardPromotionsApi = {
  // Promotions running today; expired ones never come back.
  active(): Promise<CardPromotion[]> {
    return apiFetch<CardPromotion[]>('/card-promotions')
  },
}
