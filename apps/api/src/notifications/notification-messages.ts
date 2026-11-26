// Push copy (Spanish) for the watch notifications. Pure, tested; prices come
// in already formatted (common/currency formatPrice, per country stack).
// data.url is an app path (apps/mobile deepLinks); data.type names the kind.

import type { ExpoPushMessage } from './push-messages'
import type { NotificationType } from './notification-prefs'

export type PushContent = Pick<ExpoPushMessage, 'title' | 'body' | 'data'>

// Android channels: alerts the user follows vs opt-in promotions (the app
// creates both; see apps/mobile usePushNotifications).
export const ALERTS_CHANNEL = 'price-alerts'
export const PROMOTIONS_CHANNEL = 'promotions'

const MAX_NAME_LENGTH = 80

export function shortName(name: string): string {
  return name.length > MAX_NAME_LENGTH ? `${name.slice(0, MAX_NAME_LENGTH - 1).trimEnd()}…` : name
}

function productData(type: NotificationType, slug: string | null): Record<string, string> {
  const data: Record<string, string> = { type }
  if (slug) data.url = `/product/${encodeURIComponent(slug)}`
  return data
}

function andMore(name: string, more: number): string {
  return more > 0 ? `${shortName(name)} y ${more} ${more === 1 ? 'producto más' : 'productos más'}` : shortName(name)
}

export function backInStockPush(input: { productName: string; price: string; store: string | null; slug: string | null }): PushContent {
  const where = input.store ? ` en ${input.store}` : ''
  return {
    title: 'Volvió a estar disponible',
    body: `${shortName(input.productName)} ya está disponible${where}: ${input.price}.`,
    data: productData('back_in_stock', input.slug),
  }
}

export function lowestPrice90dPush(input: { productName: string; price: string; slug: string | null }): PushContent {
  return {
    title: 'Precio más bajo en 90 días',
    body: `${shortName(input.productName)}: ahora ${input.price}, lo más barato en 3 meses.`,
    data: productData('lowest_price_90d', input.slug),
  }
}

export interface CardDiscountCopy {
  store: string
  bank: string
  card: string | null
  percent: number
  kind: 'discount' | 'cashback'
  /** e.g. " los martes", or "" */
  days: string
}

/** "10 % con tarjetas BHD Visa los martes" / "5 % de reembolso con ..." */
export function cardDiscountPhrase(promo: CardDiscountCopy): string {
  const percent = `${Number.isInteger(promo.percent) ? promo.percent : promo.percent.toFixed(1)} %`
  const card = promo.card ? `${promo.bank} ${promo.card}` : promo.bank
  return promo.kind === 'cashback'
    ? `${percent} de reembolso con tarjetas ${card}${promo.days}`
    : `${percent} con tarjetas ${card}${promo.days}`
}

export function cardDiscountPush(promo: CardDiscountCopy, product: { productName: string; slug: string | null }, more: number): PushContent {
  return {
    title: `Nuevo descuento con tarjeta en ${promo.store}`,
    body: `${cardDiscountPhrase(promo)}. Aplica a ${andMore(product.productName, more)} de tus guardados.`,
    data: productData('card_discount', product.slug),
  }
}

export function savedSearchPush(input: { query: string; productName: string; price: string; slug: string | null; count: number }): PushContent {
  const body = input.count > 1
    ? `${input.count} productos nuevos o más baratos, como ${shortName(input.productName)} a ${input.price}.`
    : `${shortName(input.productName)}: ${input.price}.`
  const data: Record<string, string> = input.count > 1 ? { type: 'saved_search', url: '/search' } : productData('saved_search', input.slug)
  return { title: `Novedades en tu búsqueda “${shortName(input.query)}”`, body, data }
}

export function weeklyDigestPush(summary: string): PushContent {
  return {
    title: 'Tu resumen de la semana',
    body: `De lo que guardaste, ${summary}.`,
    data: { type: 'weekly_digest', url: '/alerts' },
  }
}

export function dealRealPush(input: { seasonName: string; productName: string; price: string; pct: number; slug: string | null; more: number }): PushContent {
  const body = input.more > 0
    ? `${andMore(input.productName, input.more)} de tus guardados están bajo su precio promedio de 30 días.`
    : `${shortName(input.productName)}: ${input.price}, ${input.pct} % bajo su promedio de 30 días.`
  return { title: `Oferta real de ${input.seasonName}`, body, data: productData('deal_real', input.slug) }
}
