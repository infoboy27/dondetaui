import { Pool } from 'pg'
import { AlertsRepository } from './alerts.repository'
import { EmailProvider } from '../notifications/email.provider'
import { SmsProvider } from '../notifications/sms.provider'
import { NotificationsService } from '../notifications/notifications.service'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const pool = new Pool({ connectionString: databaseUrl, max: 5 })
const alerts = new AlertsRepository(pool)
const notifications = new NotificationsService(new EmailProvider(), new SmsProvider())

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

async function productName(productId: string): Promise<string | null> {
  const result = await pool.query<{ name: string }>('select name from products where id = $1', [productId])
  return result.rows[0]?.name ?? null
}

async function main() {
  const candidates = await alerts.findAllForWorker()
  let notified = 0

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

    const name = await productName(candidate.product_id)
    if (!name) continue

    await notifications.notifyPriceDrop(
      { email: candidate.user_email, phone: candidate.user_phone },
      name,
      latest.price,
    )
    await alerts.markNotified(candidate.alert_id, latest.price)
    notified += 1
    console.log(`[alerts] notified ${candidate.user_email} — ${name} dropped to RD$${latest.price}`)
  }

  console.log(`[alerts] checked ${candidates.length} alerts, sent ${notified} notifications`)
}

main()
  .catch(error => {
    console.error('[alerts] check-price-drops failed:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
