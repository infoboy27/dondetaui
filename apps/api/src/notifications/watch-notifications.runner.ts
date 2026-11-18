import type { Pool } from 'pg'
import { formatPrice } from '../common/currency'
import { NOTIFICATION_TYPES } from './notification-prefs'
import { countryUtcOffsetHours, localDate } from './notification-rules'
import type { NotificationsService } from './notifications.service'
import { PushBudget } from './push-messages'
import type { PushTokensRepository } from './push-tokens.repository'
import { WatchNotificationsRepository } from './watch-notifications.repository'
import { planWatchNotifications } from './watch-plan'

// Watch notifications (back in stock, 90-day low, card discount, saved
// search, weekly summary, real seasonal offers), run by the alerts worker
// right after the price-drop alerts (check-price-drops.cli.ts) so both share
// the per-user push budget. Decisions live in watch-plan.ts (pure, tested).

/** Watch notifications (email + push) one user can get per worker run; the rest wait for the next run. */
export const MAX_WATCH_NOTIFICATIONS_PER_USER_PER_RUN = 3

export interface WatchRunDeps {
  pool: Pool
  notifications: NotificationsService
  pushTokens: PushTokensRepository
  /** Shared with the price-drop pass: at most MAX_PRICE_DROP_PUSHES_PER_USER_PER_RUN pushes per user per run overall. */
  pushBudget: PushBudget
  sendPush: boolean
  now?: Date
}

export async function runWatchNotifications(deps: WatchRunDeps): Promise<void> {
  const now = deps.now ?? new Date()
  const offsetHours = countryUtcOffsetHours(process.env.COUNTRY_CODE)
  const siteUrl = (process.env.SITE_URL ?? 'https://dondeta.com.do').replace(/\/+$/, '')
  const repo = new WatchNotificationsRepository(deps.pool)

  const [recipients, watched, savedSearchMatches, sent] = await Promise.all([
    repo.recipients(),
    repo.watched(),
    repo.savedSearchMatches(),
    repo.sentKeys([...NOTIFICATION_TYPES]),
  ])
  const productIds = [...new Set(watched.map(w => w.productId))]
  const today = localDate(now, offsetHours)
  const cardPromotions = await repo.recentCardPromotions(today)
  const [snapshots, stockStates, retailerOffers] = await Promise.all([
    repo.snapshots(productIds),
    repo.stockStates(productIds),
    repo.offersAtRetailers(productIds, [...new Set(cardPromotions.map(p => p.retailerId))]),
  ])

  const plan = planWatchNotifications({
    now,
    offsetHours,
    siteUrl,
    formatPrice,
    recipients,
    watched,
    snapshots,
    stockStates,
    cardPromotions,
    retailerOffers,
    savedSearchMatches,
    sent,
  })

  const byUser = new Map(recipients.map(r => [r.userId, r]))
  const budget = new PushBudget(MAX_WATCH_NOTIFICATIONS_PER_USER_PER_RUN)
  let delivered = 0
  let pushed = 0
  let deferred = 0
  // Products whose back-in-stock news didn't reach someone yet: keep their old
  // stock state so the transition is detected (and sent) again next run.
  const pendingStock = new Set<string>()

  for (const item of plan.notifications) {
    const recipient = byUser.get(item.userId)
    if (!recipient) continue
    // Over the per-user cap: not marked, so it is reconsidered next run.
    if (!budget.take(item.userId)) {
      deferred += 1
      if (item.productId) pendingStock.add(item.productId)
      continue
    }

    let emailed = false
    try {
      await deps.notifications.sendEmail(recipient.email, item.email)
      emailed = true
    } catch (error) {
      console.warn(`[alerts] ${item.type} email failed:`, error)
    }

    let didPush = false
    if (deps.sendPush && recipient.pushTokens.length && deps.pushBudget.take(item.userId)) {
      try {
        const outcome = await deps.notifications.pushContent(recipient.pushTokens, item.push, item.channel)
        await deps.pushTokens.savePendingTickets(outcome.pending)
        await deps.pushTokens.disable(outcome.disable)
        didPush = outcome.pending.length > 0
      } catch (error) {
        console.warn(`[alerts] ${item.type} push failed:`, error)
      }
    }

    // Nothing went out: retried next run instead of being lost.
    if (!emailed && !didPush) {
      if (item.productId) pendingStock.add(item.productId)
      continue
    }
    await repo.markSent(item.userId, item.type, item.keys)
    delivered += 1
    if (didPush) pushed += 1
  }

  // Stock states are saved after sending, so a crash re-detects the transition;
  // the back_in_stock markers keep it from going out twice to anyone.
  await repo.saveStockStates(plan.stockUpdates.filter(update => !pendingStock.has(update.productId)))
  await repo.pruneEvents()

  console.log(`[alerts] watch notifications: ${plan.notifications.length} planned, ${delivered} sent (${pushed} with push), ${deferred} deferred by the per-user cap`)
}
