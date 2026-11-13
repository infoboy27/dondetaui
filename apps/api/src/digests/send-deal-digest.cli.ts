import { Pool } from 'pg'
import { dealDigestEmail } from '../auth/account-emails'
import { formatPrice } from '../common/currency'
import { EmailProvider } from '../notifications/email.provider'
import { buildReport } from '../products/price-check'
import { ProductsRepository } from '../products/products.repository'
import { digestLinks, digestSlot } from './digest-schedule'
import { DigestsRepository } from './digests.repository'
import { pickDigestDeals } from './digest-deals'

// "Las ofertas reales de Black Friday" by email (deploy/alerts-loop.sh runs
// this after check-price-drops, every alerts cycle). Does nothing outside the
// send days in digest-schedule.ts, sends at most one email per subscriber per
// day, and skips the day entirely while no product is really at its lowest.
// The links and copy are Dominican (dondeta.com.do), so other stacks skip it.

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const MAX_DEALS = 8

async function main() {
  if ((process.env.COUNTRY_CODE ?? 'DO') !== 'DO') return
  const slot = digestSlot()
  if (!slot) return
  // Without Resend nothing is delivered; don't mark anyone as sent.
  if (!process.env.RESEND_API_KEY) {
    console.log(`[digest] ${slot.day}: RESEND_API_KEY not set, skipping`)
    return
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 2 })
  try {
    const digests = new DigestsRepository(pool)
    const recipients = await digests.pending('black-friday', slot.day)
    if (!recipients.length) return

    const report = buildReport(await new ProductsRepository(pool).priceCheckSeries())
    // Gaming codes (Eneba) stay out, as in "Bajaron de precio".
    const gaming = await pool.query<{ id: string }>(
      `select p.id::text as id from products p join categories c on c.id = p.category_id where c.slug = 'gaming'`,
    )
    const deals = pickDigestDeals(report.lowest, new Set(gaming.rows.map(r => r.id)), MAX_DEALS)
    if (!deals.length) {
      console.log(`[digest] ${slot.day}: no real offers today, nothing sent to ${recipients.length} subscribers`)
      return
    }

    const email = new EmailProvider()
    const year = Number(slot.day.slice(0, 4))
    let sent = 0
    for (const recipient of recipients) {
      const links = digestLinks(null, recipient.unsubscribe_token, year)
      const content = dealDigestEmail({
        name: recipient.name,
        eventName: slot.eventName,
        pageUrl: links.page,
        unsubscribeUrl: links.unsubscribe,
        deals: deals.map(d => ({
          name: d.productName,
          price: formatPrice(d.current),
          store: d.store,
          note: `${Math.abs(d.pctVsReference)} % bajo su mínimo de 30 días (antes ${formatPrice(d.reference)})`,
          url: digestLinks(d.productSlug, recipient.unsubscribe_token, year).product,
          imageUrl: d.image,
        })),
      })
      try {
        await email.send(recipient.email, content.subject, content.text, content.html)
        await digests.markSent(recipient.subscription_id, slot.day)
        sent += 1
      } catch (error) {
        // Retried next cycle (last_sent_on not updated).
        console.error(`[digest] failed for subscription ${recipient.subscription_id}:`, error)
      }
    }
    console.log(`[digest] ${slot.day}: sent ${sent}/${recipients.length} with ${deals.length} offers`)
  } finally {
    await pool.end()
  }
}

main().catch(error => {
  console.error('[digest] send-deal-digest failed:', error)
  process.exitCode = 1
})
