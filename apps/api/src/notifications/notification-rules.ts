// When each watch notification fires. Pure (no Nest / pg imports) so every
// decision is unit-tested in the root vitest suite; the alerts worker
// (watch-notifications.runner.ts) feeds them rows and does the sending.
//
// Dedupe: every send is recorded in notification_events under an event key
// built here, and a key that is already there is never sent again.

import { blackFridayUtc } from '../digests/digest-schedule'

const DAY_MS = 86_400_000

export interface PricePoint {
  /** YYYY-MM-DD */
  date: string
  price: number
}

// ---------------------------------------------------------------- dates

/** Hours from UTC per country stack (CO/MX/US approximate: the send hour is all it moves). */
export function countryUtcOffsetHours(countryCode: string | undefined): number {
  switch ((countryCode ?? 'DO').toUpperCase()) {
    case 'CO': return -5
    case 'MX': return -6
    case 'US': return -5
    default: return -4
  }
}

function localNow(now: Date, offsetHours: number): Date {
  return new Date(now.getTime() + offsetHours * 3_600_000)
}

/** Local calendar date (YYYY-MM-DD) for the stack's country. */
export function localDate(now: Date, offsetHours: number): string {
  return localNow(now, offsetHours).toISOString().slice(0, 10)
}

export function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

/** ISO-8601 week id, e.g. 2026-W47 (weeks start on Monday). */
export function isoWeekKey(day: string): string {
  const date = new Date(`${day}T00:00:00Z`)
  const weekday = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - weekday) // Thursday of this week decides the year
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((date.getTime() - yearStart) / DAY_MS + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

// ---------------------------------------------------------------- back_in_stock

export type StockState = 'in_stock' | 'out_of_stock'
export type ObservedStock = StockState | 'unknown'

/**
 * What the product looks like right now from its current (fresh) offers:
 * in stock if any store has it, out of stock only when the stores that list
 * it all say so. No fresh offer at all (delisted, scraper hiccup) is unknown,
 * so a broken scraper coming back never reads as "back in stock".
 */
export function observedStock(freshInStock: number, freshOutOfStock: number): ObservedStock {
  if (freshInStock > 0) return 'in_stock'
  if (freshOutOfStock > 0) return 'out_of_stock'
  return 'unknown'
}

/**
 * Next stored state, and whether this is a back-in-stock moment: only an
 * out_of_stock -> in_stock transition fires. The first observation of a
 * product just records its state; unknown keeps the stored one.
 */
export function nextStockState(stored: StockState | null, observed: ObservedStock): { state: StockState | null; backInStock: boolean } {
  if (observed === 'unknown') return { state: stored, backInStock: false }
  return { state: observed, backInStock: stored === 'out_of_stock' && observed === 'in_stock' }
}

// ---------------------------------------------------------------- lowest_price_90d

export const LOWEST_WINDOW_DAYS = 90
/** Fewer days of history than this says nothing about "the lowest in 90 days". */
export const LOWEST_MIN_DAYS = 14

function validPrices(points: PricePoint[]): number[] {
  return points.map(p => p.price).filter(price => Number.isFinite(price) && price > 0)
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

/** Points of the `days` days before `today` (today itself excluded). */
export function pointsBefore(points: PricePoint[], today: string, days: number): PricePoint[] {
  const from = addDays(today, -days)
  return points.filter(p => p.date >= from && p.date < today)
}

/**
 * Today's price is strictly below every daily price of the previous 90 days.
 * Strict, so the same price doesn't fire again tomorrow (yesterday joins the
 * window). A price under half the usual one is a mismatched listing or a
 * scrape error, not a deal, and is ignored.
 */
export function isLowestIn90Days(current: number | null, previous: PricePoint[]): boolean {
  if (current === null || !(current > 0)) return false
  const prices = validPrices(previous)
  if (prices.length < LOWEST_MIN_DAYS) return false
  if (current < median(prices) * 0.5) return false
  return current < Math.min(...prices)
}

/** The regular price-drop alert says it too: one message, not two. */
export function mergeLowestIntoDrop(userWantsLowest: boolean, isLowest: boolean): boolean {
  return userWantsLowest && isLowest
}

// ---------------------------------------------------------------- card_discount

export interface CardPromotionDates {
  startsOn: string
  endsOn: string
  /** Day the promotion was loaded in the admin (YYYY-MM-DD). */
  createdOn: string
}

/**
 * Running today, and it started (or was loaded) today or yesterday. Older
 * promotions aren't news: without this, the first run after launch would
 * announce every promotion already running.
 */
export function cardPromotionIsNew(promo: CardPromotionDates, today: string): boolean {
  if (promo.startsOn > today || promo.endsOn < today) return false
  const becameActive = promo.createdOn > promo.startsOn ? promo.createdOn : promo.startsOn
  return becameActive >= addDays(today, -1)
}

const WEEKDAY_PLURAL = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados']

/** " los martes y jueves", or "" when it applies every day. */
export function weekdaysPhrase(weekdays: number[] | null): string {
  if (!weekdays?.length || weekdays.length === 7) return ''
  const names = [...new Set(weekdays)].sort((a, b) => a - b).map(day => WEEKDAY_PLURAL[day]).filter((n): n is string => !!n)
  if (!names.length) return ''
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
  return ` los ${list}`
}

// ---------------------------------------------------------------- saved_search

export interface SavedSearchSpec {
  /** ISO timestamp the search was saved. */
  createdAt: string
  maxPrice: number | null
}

export interface SavedSearchCandidate {
  /** ISO timestamp the product was first seen. */
  createdAt: string
  /** Best current in-stock price. */
  current: number
  /** Yesterday's lowest price, or null without an observation. */
  previous: number | null
}

export type SavedSearchReason = 'new' | 'under_max'

/**
 * A product matching the search fires when it is new since the search was
 * saved (and within the max price, if any), or when it just crossed under the
 * max price (yesterday above, today at or below). Products that were already
 * there and already cheap are what the user saw when saving: not news.
 */
export function savedSearchReason(search: SavedSearchSpec, candidate: SavedSearchCandidate): SavedSearchReason | null {
  if (!(candidate.current > 0)) return null
  if (search.maxPrice !== null && candidate.current > search.maxPrice) return null
  if (Date.parse(candidate.createdAt) > Date.parse(search.createdAt)) return 'new'
  if (search.maxPrice !== null && candidate.previous !== null && candidate.previous > search.maxPrice) return 'under_max'
  return null
}

// ---------------------------------------------------------------- deal_real (promotional)

/** Today must be at least this far under the 30-day average (noise guard). */
export const DEAL_REAL_MIN_PCT = 3
export const DEAL_REAL_MIN_DAYS = 7

/**
 * The Black Friday season, in local time: from the Monday before Black Friday
 * through Cyber Monday. Returns a key for the season (dedupe: one message per
 * product per season), or null outside it.
 */
export function dealSeason(now: Date, offsetHours: number): { key: string; name: string } | null {
  const local = localNow(now, offsetHours)
  const year = local.getUTCFullYear()
  const today = Date.UTC(year, local.getUTCMonth(), local.getUTCDate())
  const offset = Math.round((today - blackFridayUtc(year)) / DAY_MS)
  if (offset < -4 || offset > 3) return null
  return { key: `black-friday-${year}`, name: offset > 0 ? 'Cyber Monday' : 'Black Friday' }
}

/** "Esta oferta es real": today's price is clearly below its own 30-day average. Returns the % under, or null. */
export function dealRealPct(current: number | null, last30: PricePoint[]): number | null {
  if (current === null || !(current > 0)) return null
  const prices = validPrices(last30)
  if (prices.length < DEAL_REAL_MIN_DAYS) return null
  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const pct = Math.round((1 - current / average) * 100)
  return pct >= DEAL_REAL_MIN_PCT ? pct : null
}

// ---------------------------------------------------------------- weekly_digest (promotional)

/** Sunday from 10:00 local time; the key is the ISO week (one digest per week). */
export function weeklyDigestSlot(now: Date, offsetHours: number): { key: string } | null {
  const local = localNow(now, offsetHours)
  if (local.getUTCDay() !== 0 || local.getUTCHours() < 10) return null
  return { key: isoWeekKey(local.toISOString().slice(0, 10)) }
}

/** The latest daily price on or before `day`, or null. */
export function priceOnOrBefore(points: PricePoint[], day: string): number | null {
  let found: PricePoint | null = null
  for (const point of points) {
    if (point.date <= day && point.price > 0 && (!found || point.date > found.date)) found = point
  }
  return found?.price ?? null
}

export interface WeeklyItem {
  productId: string
  name: string
  slug: string | null
  imageUrl: string | null
  store: string | null
  /** Best current in-stock price, null when no store has it now. */
  current: number | null
  /** Lowest price a week ago, null without history. */
  weekAgo: number | null
}

export interface WeeklyChange extends WeeklyItem {
  current: number
  weekAgo: number
  /** Signed % change vs a week ago (negative = cheaper). */
  pct: number
}

export interface WeeklyDigest {
  dropped: WeeklyChange[]
  rose: WeeklyChange[]
}

/** Moves smaller than this are rounding noise, not news. */
export const WEEKLY_MIN_CHANGE_PCT = 1

/** What changed in the user's saved products this week; null when nothing did (no empty digests). */
export function buildWeeklyDigest(items: WeeklyItem[], limit = 8): WeeklyDigest | null {
  const changes: WeeklyChange[] = []
  for (const item of items) {
    if (item.current === null || item.weekAgo === null || !(item.weekAgo > 0)) continue
    const pct = Math.round(((item.current - item.weekAgo) / item.weekAgo) * 1000) / 10
    if (Math.abs(pct) < WEEKLY_MIN_CHANGE_PCT) continue
    changes.push({ ...item, current: item.current, weekAgo: item.weekAgo, pct })
  }
  const dropped = changes.filter(c => c.pct < 0).sort((a, b) => a.pct - b.pct).slice(0, limit)
  const rose = changes.filter(c => c.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, limit)
  if (!dropped.length && !rose.length) return null
  return { dropped, rose }
}

/** "3 bajaron de precio y 1 subió" */
export function weeklyDigestSummary(digest: WeeklyDigest): string {
  const parts: string[] = []
  if (digest.dropped.length) parts.push(digest.dropped.length === 1 ? '1 bajó de precio' : `${digest.dropped.length} bajaron de precio`)
  if (digest.rose.length) parts.push(digest.rose.length === 1 ? '1 subió' : `${digest.rose.length} subieron`)
  return parts.join(' y ')
}

// ---------------------------------------------------------------- dedupe keys

export const eventKeys = {
  /** One back-in-stock per product per local day (a flapping listing can't buzz all day). */
  backInStock: (productId: string, day: string) => `${productId}:${day}`,
  /** One 90-day low per product per day; shared by the merged price-drop message. */
  lowest90d: (productId: string, day: string) => `${productId}:${day}`,
  cardDiscount: (promotionId: string) => promotionId,
  savedSearch: (searchId: string, productId: string) => `${searchId}:${productId}`,
  weeklyDigest: (week: string) => week,
  dealRealProduct: (productId: string, season: string) => `${productId}:${season}`,
  /** At most one promotional deal message per user per day. */
  dealRealDay: (day: string) => `day:${day}`,
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** "2026-11-30" -> "30 de noviembre" */
export function formatDayEs(day: string): string {
  const [, month, date] = day.split('-').map(Number)
  const name = month ? MONTHS[month - 1] : undefined
  return name && date ? `${date} de ${name}` : day
}
