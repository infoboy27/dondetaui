// Turns what the alerts worker read from the database into the list of watch
// notifications to send this run. Pure (no Nest / pg): the whole decision --
// prefs, dedupe, grouping, copy -- is unit-tested; the runner only delivers
// and records what it sent.

import {
  backInStockEmail,
  cardDiscountEmail,
  dealRealEmail,
  lowestPrice90dEmail,
  savedSearchEmail,
  weeklyDigestEmail,
  type DealRow,
  type EmailContent,
} from '../auth/account-emails'
import {
  ALERTS_CHANNEL,
  PROMOTIONS_CHANNEL,
  backInStockPush,
  cardDiscountPhrase,
  cardDiscountPush,
  dealRealPush,
  lowestPrice90dPush,
  savedSearchPush,
  weeklyDigestPush,
  type PushContent,
} from './notification-messages'
import { resolvePrefs, type NotificationPrefs, type NotificationType } from './notification-prefs'
import {
  addDays,
  buildWeeklyDigest,
  cardPromotionIsNew,
  dealRealPct,
  dealSeason,
  eventKeys,
  formatDayEs,
  isLowestIn90Days,
  localDate,
  nextStockState,
  observedStock,
  pointsBefore,
  priceOnOrBefore,
  savedSearchReason,
  weeklyDigestSlot,
  weeklyDigestSummary,
  weekdaysPhrase,
  LOWEST_WINDOW_DAYS,
  type PricePoint,
  type StockState,
  type WeeklyItem,
} from './notification-rules'

export interface WatchRecipient {
  userId: string
  email: string
  name: string | null
  pushTokens: string[]
  /** Raw stored overrides (resolved with notification-prefs). */
  prefs: unknown
}

export interface ProductSnapshot {
  productId: string
  name: string
  slug: string | null
  imageUrl: string | null
  /** Best fresh in-stock price (price + shipping), or null. */
  current: number | null
  /** Store with that price. */
  store: string | null
  freshInStock: number
  freshOutOfStock: number
  /** Daily lowest price of the previous 90 days (today excluded), oldest first. */
  history: PricePoint[]
}

export interface RecentCardPromotion {
  id: string
  retailerId: string
  store: string
  bank: string
  card: string | null
  percent: number
  kind: 'discount' | 'cashback'
  weekdays: number[] | null
  startsOn: string
  endsOn: string
  createdOn: string
}

export interface RetailerOffer {
  productId: string
  retailerId: string
  price: number
}

export interface SavedSearchMatch {
  searchId: string
  userId: string
  query: string
  maxPrice: number | null
  searchCreatedAt: string
  productId: string
  name: string
  slug: string | null
  imageUrl: string | null
  productCreatedAt: string
  store: string | null
  current: number
  previous: number | null
}

export interface PlannedNotification {
  userId: string
  type: NotificationType
  /** Dedupe markers recorded once it is delivered. */
  keys: string[]
  email: EmailContent
  push: PushContent
  channel: string
  /** Set on back_in_stock: its stock transition is only saved once delivered. */
  productId?: string
}

export interface PlanInput {
  now: Date
  offsetHours: number
  /** e.g. https://dondeta.com.do (the stack's own site) */
  siteUrl: string
  formatPrice: (price: number) => string
  recipients: WatchRecipient[]
  watched: { userId: string; productId: string }[]
  snapshots: Map<string, ProductSnapshot>
  stockStates: Map<string, StockState>
  cardPromotions: RecentCardPromotion[]
  retailerOffers: RetailerOffer[]
  savedSearchMatches: SavedSearchMatch[]
  /** "user|type|key" already sent (watch-notifications.repository sentKey). */
  sent: Set<string>
}

export interface Plan {
  notifications: PlannedNotification[]
  stockUpdates: { productId: string; state: StockState }[]
}

/** Products listed in one grouped email / counted in its push. */
export const MAX_LISTED = 8

export function sentKey(userId: string, type: string, key: string): string {
  return `${userId}|${type}|${key}`
}

export function productUrl(siteUrl: string, slug: string | null): string {
  return slug ? `${siteUrl}/product/${encodeURIComponent(slug)}` : siteUrl
}

// Alerts the user follows first, promotions last: the per-user cap in the
// runner then drops (defers) promotions before alerts.
const ORDER: NotificationType[] = ['back_in_stock', 'lowest_price_90d', 'card_discount', 'saved_search', 'weekly_digest', 'deal_real']

export function planWatchNotifications(input: PlanInput): Plan {
  const today = localDate(input.now, input.offsetHours)
  const price = input.formatPrice
  const prefsByUser = new Map<string, NotificationPrefs>()
  const recipients = new Map<string, WatchRecipient>()
  for (const recipient of input.recipients) {
    recipients.set(recipient.userId, recipient)
    prefsByUser.set(recipient.userId, resolvePrefs(recipient.prefs))
  }
  const wants = (userId: string, type: NotificationType) => prefsByUser.get(userId)?.[type] === true
  const unsent = (userId: string, type: NotificationType, key: string) => !input.sent.has(sentKey(userId, type, key))

  const watchersByProduct = new Map<string, string[]>()
  const productsByUser = new Map<string, string[]>()
  for (const { userId, productId } of input.watched) {
    if (!recipients.has(userId)) continue
    const watchers = watchersByProduct.get(productId) ?? []
    if (!watchers.includes(userId)) watchers.push(userId)
    watchersByProduct.set(productId, watchers)
    const products = productsByUser.get(userId) ?? []
    if (!products.includes(productId)) products.push(productId)
    productsByUser.set(userId, products)
  }

  const out: PlannedNotification[] = []
  const stockUpdates: Plan['stockUpdates'] = []
  const alert = (n: Omit<PlannedNotification, 'channel'>) => out.push({ ...n, channel: ALERTS_CHANNEL })
  const promo = (n: Omit<PlannedNotification, 'channel'>) => out.push({ ...n, channel: PROMOTIONS_CHANNEL })

  const row = (snapshot: ProductSnapshot, amount: number, store: string, note: string): DealRow => ({
    name: snapshot.name,
    price: price(amount),
    store,
    note,
    url: productUrl(input.siteUrl, snapshot.slug),
    imageUrl: snapshot.imageUrl,
  })

  // back_in_stock + lowest_price_90d: per watched product.
  for (const [productId, watchers] of watchersByProduct) {
    const snapshot = input.snapshots.get(productId)
    if (!snapshot) continue

    const stored = input.stockStates.get(productId) ?? null
    const next = nextStockState(stored, observedStock(snapshot.freshInStock, snapshot.freshOutOfStock))
    if (next.state && next.state !== stored) stockUpdates.push({ productId, state: next.state })
    if (next.backInStock && snapshot.current !== null) {
      const key = eventKeys.backInStock(productId, today)
      for (const userId of watchers) {
        if (!wants(userId, 'back_in_stock') || !unsent(userId, 'back_in_stock', key)) continue
        const current = price(snapshot.current)
        alert({
          userId,
          type: 'back_in_stock',
          productId,
          keys: [key],
          email: backInStockEmail({ name: snapshot.name, price: current, store: snapshot.store, imageUrl: snapshot.imageUrl, url: productUrl(input.siteUrl, snapshot.slug) }),
          push: backInStockPush({ productName: snapshot.name, price: current, store: snapshot.store, slug: snapshot.slug }),
        })
      }
    }

    if (isLowestIn90Days(snapshot.current, pointsBefore(snapshot.history, today, LOWEST_WINDOW_DAYS)) && snapshot.current !== null) {
      const key = eventKeys.lowest90d(productId, today)
      for (const userId of watchers) {
        if (!wants(userId, 'lowest_price_90d') || !unsent(userId, 'lowest_price_90d', key)) continue
        const current = price(snapshot.current)
        alert({
          userId,
          type: 'lowest_price_90d',
          keys: [key],
          email: lowestPrice90dEmail({ name: snapshot.name, price: current, imageUrl: snapshot.imageUrl, url: productUrl(input.siteUrl, snapshot.slug) }),
          push: lowestPrice90dPush({ productName: snapshot.name, price: current, slug: snapshot.slug }),
        })
      }
    }
  }

  // card_discount: one message per (user, new promotion), listing the saved products it applies to.
  const offerAt = new Map<string, number>()
  for (const offer of input.retailerOffers) offerAt.set(`${offer.productId}|${offer.retailerId}`, offer.price)
  for (const promotion of input.cardPromotions) {
    if (!cardPromotionIsNew(promotion, today)) continue
    const key = eventKeys.cardDiscount(promotion.id)
    const phrase = cardDiscountPhrase({ ...promotion, days: weekdaysPhrase(promotion.weekdays) })
    for (const [userId, productIds] of productsByUser) {
      if (!wants(userId, 'card_discount') || !unsent(userId, 'card_discount', key)) continue
      const hits = productIds
        .map(productId => ({ snapshot: input.snapshots.get(productId), amount: offerAt.get(`${productId}|${promotion.retailerId}`) }))
        .filter((hit): hit is { snapshot: ProductSnapshot; amount: number } => !!hit.snapshot && hit.amount !== undefined)
        .sort((a, b) => b.amount - a.amount)
      if (!hits.length) continue
      const first = hits[0]!
      alert({
        userId,
        type: 'card_discount',
        keys: [key],
        email: cardDiscountEmail({
          store: promotion.store,
          phrase,
          endsOn: formatDayEs(promotion.endsOn),
          products: hits.slice(0, MAX_LISTED).map(hit => row(hit.snapshot, hit.amount, promotion.store, phrase)),
        }),
        push: cardDiscountPush(
          { ...promotion, days: weekdaysPhrase(promotion.weekdays) },
          { productName: first.snapshot.name, slug: first.snapshot.slug },
          hits.length - 1,
        ),
      })
    }
  }

  // saved_search: one message per search, listing new / newly-affordable matches.
  const bySearch = new Map<string, SavedSearchMatch[]>()
  for (const match of input.savedSearchMatches) {
    const list = bySearch.get(match.searchId) ?? []
    list.push(match)
    bySearch.set(match.searchId, list)
  }
  for (const [searchId, matches] of bySearch) {
    const first = matches[0]!
    const userId = first.userId
    if (!recipients.has(userId) || !wants(userId, 'saved_search')) continue
    const fresh = matches
      .map(match => ({ match, reason: savedSearchReason({ createdAt: match.searchCreatedAt, maxPrice: match.maxPrice }, { createdAt: match.productCreatedAt, current: match.current, previous: match.previous }) }))
      .filter(entry => entry.reason !== null && unsent(userId, 'saved_search', eventKeys.savedSearch(searchId, entry.match.productId)))
      .sort((a, b) => a.match.current - b.match.current)
      .slice(0, MAX_LISTED)
    if (!fresh.length) continue
    const cheapest = fresh[0]!.match
    alert({
      userId,
      type: 'saved_search',
      keys: fresh.map(entry => eventKeys.savedSearch(searchId, entry.match.productId)),
      email: savedSearchEmail({
        query: first.query,
        maxPrice: first.maxPrice === null ? null : price(first.maxPrice),
        products: fresh.map(({ match, reason }) => ({
          name: match.name,
          price: price(match.current),
          store: match.store ?? '',
          note: reason === 'new' ? 'Nuevo en DóndeTa' : `Bajó de ${price(match.previous ?? match.current)}`,
          url: productUrl(input.siteUrl, match.slug),
          imageUrl: match.imageUrl,
        })),
      }),
      push: savedSearchPush({ query: first.query, productName: cheapest.name, price: price(cheapest.current), slug: cheapest.slug, count: fresh.length }),
    })
  }

  // weekly_digest (opt-in): Sunday morning, one per ISO week.
  const slot = weeklyDigestSlot(input.now, input.offsetHours)
  if (slot) {
    for (const [userId, productIds] of productsByUser) {
      if (!wants(userId, 'weekly_digest') || !unsent(userId, 'weekly_digest', eventKeys.weeklyDigest(slot.key))) continue
      const items: WeeklyItem[] = []
      for (const productId of productIds) {
        const snapshot = input.snapshots.get(productId)
        if (!snapshot) continue
        items.push({
          productId,
          name: snapshot.name,
          slug: snapshot.slug,
          imageUrl: snapshot.imageUrl,
          store: snapshot.store,
          current: snapshot.current,
          weekAgo: priceOnOrBefore(snapshot.history, addDays(today, -7)),
        })
      }
      const digest = buildWeeklyDigest(items)
      if (!digest) continue
      const summary = weeklyDigestSummary(digest)
      const recipient = recipients.get(userId)!
      promo({
        userId,
        type: 'weekly_digest',
        keys: [eventKeys.weeklyDigest(slot.key)],
        email: weeklyDigestEmail({
          name: recipient.name,
          summary,
          pageUrl: `${input.siteUrl}/alerts`,
          products: [...digest.dropped, ...digest.rose].slice(0, MAX_LISTED).map(change => ({
            name: change.name,
            price: price(change.current),
            store: change.store ?? '',
            note: change.pct < 0 ? `Bajó ${Math.abs(change.pct)} % (antes ${price(change.weekAgo)})` : `Subió ${change.pct} % (antes ${price(change.weekAgo)})`,
            url: productUrl(input.siteUrl, change.slug),
            imageUrl: change.imageUrl,
          })),
        }),
        push: weeklyDigestPush(summary),
      })
    }
  }

  // deal_real (opt-in, seasonal): once per product per season, one message per user per day.
  const season = dealSeason(input.now, input.offsetHours)
  if (season) {
    const dayKey = eventKeys.dealRealDay(today)
    for (const [userId, productIds] of productsByUser) {
      if (!wants(userId, 'deal_real') || !unsent(userId, 'deal_real', dayKey)) continue
      const deals: { snapshot: ProductSnapshot; current: number; pct: number; key: string }[] = []
      for (const productId of productIds) {
        const snapshot = input.snapshots.get(productId)
        if (!snapshot || snapshot.current === null) continue
        const key = eventKeys.dealRealProduct(productId, season.key)
        if (!unsent(userId, 'deal_real', key)) continue
        const pct = dealRealPct(snapshot.current, pointsBefore(snapshot.history, today, 30))
        if (pct !== null) deals.push({ snapshot, current: snapshot.current, pct, key })
      }
      if (!deals.length) continue
      deals.sort((a, b) => b.pct - a.pct)
      const listed = deals.slice(0, MAX_LISTED)
      const best = listed[0]!
      promo({
        userId,
        type: 'deal_real',
        keys: [dayKey, ...listed.map(deal => deal.key)],
        email: dealRealEmail({
          seasonName: season.name,
          products: listed.map(deal => row(deal.snapshot, deal.current, deal.snapshot.store ?? '', `${deal.pct} % bajo su promedio de 30 días`)),
        }),
        push: dealRealPush({ seasonName: season.name, productName: best.snapshot.name, price: price(best.current), pct: best.pct, slug: best.snapshot.slug, more: listed.length - 1 }),
      })
    }
  }

  out.sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type))
  return { notifications: out, stockUpdates }
}
