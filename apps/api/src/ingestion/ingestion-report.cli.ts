import { Pool } from 'pg'
import { ingestionHealth } from './ingestion-health'

// Runs at the end of every ingestion cycle (deploy/ingestion-loop*.sh). Logs a
// per-retailer summary and, when a scraper failed, went stale or suddenly
// brought in far fewer products, posts it to DISCORD_WEBHOOK_ALERTS -- a broken
// scraper otherwise only shows up two weeks later, when its prices age out.
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const pool = new Pool({ connectionString: databaseUrl, max: 2 })
const site = process.env.SITE_URL ?? 'dondeta'

async function main() {
  const health = await ingestionHealth(pool)
  for (const r of health) {
    console.log(
      `[report] ${r.retailer}: ${r.lastStatus ?? 'never'} · ${r.lastIngested} ingested` +
      ` (prev ${r.previousIngested ?? '-'}) · ${r.freshOffers} fresh offers` +
      (r.problems.length ? ` · ${r.problems.join('; ')}` : ''),
    )
  }

  const broken = health.filter(r => r.problems.length)
  const webhook = process.env.DISCORD_WEBHOOK_ALERTS
  if (!broken.length || !webhook) return

  const lines = broken.map(r => `• **${r.retailer}**: ${r.problems.join('; ')}`)
  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: `⚠️ Ingestión ${site}\n${lines.join('\n')}` }),
  })
  if (!response.ok) console.error(`[report] Discord webhook failed (${response.status})`)
}

main()
  .catch(error => {
    console.error('[report] failed:', error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
