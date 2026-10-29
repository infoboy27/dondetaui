// Mirror of src/domain/cardPromotions.ts (the web app) for the server-rendered
// pages; keep both in sync.
import type { Offer as StorePrice } from './types'
import { formatPrice } from './format'
import { getOfferTotal } from './offers'

// A bank card discount a store runs, as served by GET /card-promotions (only
// promotions running today; the API hides and deletes expired ones).
export interface CardPromotion {
  id: string
  retailerId: string
  retailerSlug: string
  store: string
  bank: string
  card: string | null
  percent: number
  maxDiscount: number | null
  minPurchase: number
  /** 0 = Sunday; null = every day. */
  weekdays: number[] | null
  startsOn: string
  endsOn: string
  termsUrl: string | null
  note: string | null
}

export interface CardDeal {
  promotion: CardPromotion
  discount: number
  /** Purchase total (price + shipping) minus the card discount. */
  total: number
}

// Weekday in the Dominican Republic (UTC-4, no daylight saving).
export function dominicanWeekday(now = new Date()): number {
  return new Date(now.getTime() - 4 * 3_600_000).getUTCDay()
}

function sameStore(promotion: CardPromotion, offer: StorePrice): boolean {
  return offer.retailerId ? promotion.retailerId === offer.retailerId : promotion.store === offer.store
}

export function appliesOn(promotion: CardPromotion, weekday: number): boolean {
  return !promotion.weekdays || promotion.weekdays.includes(weekday)
}

// The best card discount for this offer today, if any. The percentage applies
// to the product price, capped by the bank's maximum; shipping is not
// discounted.
export function bestCardDeal(offer: StorePrice, promotions: CardPromotion[], weekday = dominicanWeekday()): CardDeal | undefined {
  if (!offer.available) return undefined
  let best: CardDeal | undefined
  for (const promotion of promotions) {
    if (!sameStore(promotion, offer) || !appliesOn(promotion, weekday) || offer.price < promotion.minPurchase) continue
    const raw = Math.round(offer.price * promotion.percent) / 100
    const discount = Math.round(promotion.maxDiscount === null ? raw : Math.min(raw, promotion.maxDiscount))
    if (discount <= 0 || (best && discount <= best.discount)) continue
    best = { promotion, discount, total: getOfferTotal(offer) - discount }
  }
  return best
}

// The lowest price anyone can get with a card, across every store.
export function bestCardDealAcross(offers: StorePrice[], promotions: CardPromotion[], weekday = dominicanWeekday()): (CardDeal & { offer: StorePrice }) | undefined {
  let best: (CardDeal & { offer: StorePrice }) | undefined
  for (const offer of offers) {
    const deal = bestCardDeal(offer, promotions, weekday)
    if (deal && (!best || deal.total < best.total)) best = { ...deal, offer }
  }
  return best
}

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export function weekdaysLabel(weekdays: number[] | null): string | null {
  if (!weekdays || weekdays.length === 0 || weekdays.length === 7) return null
  const names = weekdays.map(day => DAYS[day])
  return names.length === 1 ? `solo ${names[0]}` : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

/** "Popular Visa" or just "BHD". */
export function cardName(promotion: CardPromotion): string {
  return promotion.card ? `${promotion.bank} ${promotion.card}` : promotion.bank
}

/** Conditions in one short line: "tope RD$5,000 · solo martes". */
export function cardDealConditions(promotion: CardPromotion): string {
  return [
    promotion.maxDiscount !== null ? `tope ${formatPrice(promotion.maxDiscount)}` : null,
    promotion.minPurchase > 0 ? `compra mínima ${formatPrice(promotion.minPurchase)}` : null,
    weekdaysLabel(promotion.weekdays),
    promotion.note,
  ].filter(Boolean).join(' · ')
}
