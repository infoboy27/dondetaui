import { Pool } from 'pg'
import { AlertsRepository } from './alerts.repository'
import { EmailProvider } from '../notifications/email.provider'
import { SmsProvider } from '../notifications/sms.provider'
import { PushProvider } from '../notifications/push.provider'
import { NotificationsService } from '../notifications/notifications.service'
import { PushTokensRepository } from '../notifications/push-tokens.repository'
import { PushBudget, pushEnabled } from '../notifications/push-messages'
import { formatPrice } from '../common/currency'
import { wants } from '../notifications/notification-prefs'
import { countryUtcOffsetHours, eventKeys, isLowestIn90Days, localDate, mergeLowestIntoDrop, pointsBefore, LOWEST_WINDOW_DAYS } from '../notifications/notification-rules'
import { WatchNotificationsRepository } from '../notifications/watch-notifications.repository'
import { runWatchNotifications } from '../notifications/watch-notifications.runner'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const pool = new Pool({ connectionString: databaseUrl, max: 5 })
const alerts = new AlertsRepository(pool)
const push = new PushProvider()
const notifications = new NotificationsService(new EmailProvider(), new SmsProvider(), push)
const pushTokens = new PushTokensRepository(pool)
const watch = new WatchNotificationsRepository(pool)
// Price-drop pushes go out only with PUSH_NOTIFICATIONS_ENABLED=1 (safe to
// deploy before the apps are in the stores). Email/WhatsApp are unaffected.
const sendPush = pushEnabled(process.env)

interface HistoryPoint {
  date: string
  price: number
}

async function latestPriceHistory(productId: string): Promise<HistoryPoint[]> {
  const result = await pool.query<{ date: string; price: string }>(
    `select
      po.observed_at::date::text as date,
      min(po.price + po.shipping_price)::text as price
    from price_observations po
    join offers o on o.id = po.offer_id
    join product_variants pv on pv.id = o.product_variant_id
    where pv.product_id = $1
    group by po.observed_at::date
    order by po.observed_at::date desc
    limit 2`,
    [productId],
  )
  return result.rows.map(row => ({ date: row.date, price: Number(row.price) })).reverse()
}

async function productInfo(productId: string): Promise<{ name: string; imageUrl: string | null; slug: string | null } | null> {
  const result = await pool.query<{ name: string; image_url: string | null; slug: string | null }>('select name, image_url, slug from products where id = $1', [productId])
  const row = result.rows[0]
  return row ? { name: row.name, imageUrl: row.image_url, slug: row.slug } : null
}

// Receipts of earlier sends: tokens Expo reports as DeviceNotRegistered
// (app uninstalled, notifications revoked) are disabled, not retried.
async function processPushReceipts() {
  const due = await pushTokens.dueTickets()
  if (!due.length) return
  const { checked, disable } = await push.deadTokensFromReceipts(due)
  await pushTokens.disable(disable)
  await pushTokens.deleteTickets(checked)
  console.log(`[alerts] push receipts: ${checked.length} checked, ${disable.length} token(s) disabled`)
}

async function main() {
  if (sendPush) {
    await processPushReceipts().catch(error => console.warn('[alerts] push receipts check failed:', error))
  }

  const candidates = await alerts.findAllForWorker()
  let notified = 0
  let pushed = 0
  const pushBudget = new PushBudget()
  const now = new Date()
  const today = localDate(now, countryUtcOffsetHours(process.env.COUNTRY_CODE))
  // 90-day history of the alerted products: a drop that is also the lowest
  // price in 90 days goes out as one message (lowest_price_90d merged in).
  const snapshots = await watch.snapshots([...new Set(candidates.map(c => c.product_id))])

  for (const candidate of candidates) {
    const history = await latestPriceHistory(candidate.product_id)
    if (history.length < 2) continue

    const previous = history[history.length - 2]
    const latest = history[history.length - 1]
    if (latest.price >= previous.price) continue // no drop since the prior observation

    const targetPrice = candidate.target_price === null ? null : Number(candidate.target_price)
    if (targetPrice !== null && latest.price > targetPrice) continue // hasn't reached the target yet

    const lastNotifiedPrice = candidate.last_notified_price === null ? null : Number(candidate.last_notified_price)
    if (lastNotifiedPrice !== null && latest.price >= lastNotifiedPrice) continue // already notified at this price or lower

    const product = await productInfo(candidate.product_id)
    if (!product) continue
    const name = product.name
    const history90d = snapshots.get(candidate.product_id)?.history ?? []
    const lowest90d = mergeLowestIntoDrop(
      wants(candidate.notification_prefs, 'lowest_price_90d'),
      isLowestIn90Days(latest.price, pointsBefore(history90d, today, LOWEST_WINDOW_DAYS)),
    )

    await notifications.notifyPriceDrop(
      { email: candidate.user_email, phone: candidate.user_phone },
      name,
      latest.price,
      previous.price,
      product,
      lowest90d,
    )
    // Same dedupe as email (last_notified_price below), plus a per-user cap per run.
    if (sendPush && candidate.push_tokens.length && pushBudget.take(candidate.user_id)) {
      try {
        const outcome = await notifications.pushPriceDrop(candidate.push_tokens, name, latest.price, previous.price, product.slug, lowest90d)
        await pushTokens.savePendingTickets(outcome.pending)
        await pushTokens.disable(outcome.disable)
        if (outcome.pending.length) pushed += 1
      } catch (error) {
        console.warn('[alerts] price-drop push failed:', error)
      }
    }
    await alerts.markNotified(candidate.alert_id, latest.price)
    // The standalone 90-day-low notification must not repeat what this said.
    if (lowest90d) await watch.markSent(candidate.user_id, 'lowest_price_90d', [eventKeys.lowest90d(candidate.product_id, today)])
    notified += 1
    console.log(`[alerts] notified ${candidate.user_email} — ${name} dropped to ${formatPrice(latest.price)}`)
  }

  console.log(`[alerts] checked ${candidates.length} alerts, sent ${notified} notifications (${sendPush ? `${pushed} with push` : 'push off'})`)

  // Back in stock, 90-day low, card discounts, saved searches, weekly summary
  // and seasonal real offers -- each only if the user left it on (prefs).
  await runWatchNotifications({ pool, notifications, pushTokens, pushBudget, sendPush, now })
}

main()
  .catch(error => {
    console.error('[alerts] check-price-drops failed:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
