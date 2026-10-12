import { Pool } from 'pg'
import { IngestionRepository } from './ingestion.repository'
import { ENEBA_AFFILIATE_ID, feedRows, selectEnebaItems, type EnebaFeedRow } from './eneba.catalog'
import { formatPrice } from '../common/currency'

// Eneba affiliate feed -> the curated Gaming catalog (see eneba.catalog.ts).
// One run per stack: ENEBA_COUNTRY / ENEBA_CURRENCY pick the country feed
// (do/DOP, co/COP, mx/MXN); prices come already converted to that currency.
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const country = (process.env.ENEBA_COUNTRY ?? 'do').toLowerCase()
const currency = (process.env.ENEBA_CURRENCY ?? 'DOP').toUpperCase()
const PAGE_SIZE = 5000
const MAX_PAGES = 40

const pool = new Pool({ connectionString: databaseUrl, max: 5 })
const repository = new IngestionRepository(pool)

async function fetchFeed(): Promise<EnebaFeedRow[]> {
  const params = new URLSearchParams({
    version: '3', country, currency, link_locale: 'latam', af_id: ENEBA_AFFILIATE_ID, size: String(PAGE_SIZE),
  })
  let url: string | null = `https://www.eneba.com/rss/products.csv?${params}`
  const rows: EnebaFeedRow[] = []
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const response: Response = await fetch(url, { signal: AbortSignal.timeout(120_000) })
    if (!response.ok) throw new Error(`Eneba feed ${response.status} on page ${page + 1}`)
    rows.push(...feedRows(await response.text()))
    // Cursor pagination: Link: <...&cursor=...>; rel="next" (absent on the last page).
    const next: string | undefined = response.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1]
    url = next ? next.replace(/^http:/, 'https:') : null
  }
  return rows
}

async function main() {
  const run = await pool.query<{ id: string }>(
    `insert into ingestion_runs(source, status, items_seen) values ('eneba-feed', 'running', 0) returning id::text`,
  )
  const runId = run.rows[0].id
  let ingested = 0
  const failures: string[] = []

  try {
    const rows = await fetchFeed()
    const items = selectEnebaItems(rows, currency)
    console.log(`[eneba] feed ${country}/${currency}: ${rows.length} rows, ${items.length} selected`)
    if (!items.length) throw new Error(`Eneba feed ${country}/${currency}: nothing matched the curated catalog`)

    for (const item of items) {
      try {
        await repository.ingest(item, runId)
        ingested += 1
        console.log(`[eneba] ${ingested}/${items.length} ${item.name} ${formatPrice(item.price)}`)
      } catch (error) {
        failures.push(`${item.externalSku}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // A complete feed read is the full truth: whatever Eneba no longer
    // lists (or we dropped from the selection) can't stay "in stock".
    const stale = await pool.query(
      `update offers o
       set availability = 'out_of_stock', updated_at = now()
       from retailers r
       where r.id = o.retailer_id and r.slug = 'eneba'
         and o.availability <> 'out_of_stock'
         and not (o.external_sku = any($1::text[]))`,
      [items.map(item => item.externalSku)],
    )

    await pool.query(
      `update ingestion_runs
       set retailer_id = (select id from retailers where slug = 'eneba'),
           status = $2, items_seen = $3, items_ingested = $4, finished_at = now(),
           error_message = $5
       where id = $1`,
      [
        runId,
        ingested > 0 ? 'completed' : 'failed',
        items.length,
        ingested,
        failures.length ? `${failures.length} skipped. ${failures.slice(0, 5).join(' | ')}`.slice(0, 4_000) : null,
      ],
    )
    console.log(`[eneba] completed ${ingested}/${items.length}; ${stale.rowCount ?? 0} marked out of stock`)
  } catch (error) {
    await pool.query(
      `update ingestion_runs set status = 'failed', items_ingested = $2, error_message = $3, finished_at = now() where id = $1`,
      [runId, ingested, error instanceof Error ? error.message : String(error)],
    )
    throw error
  }
}

main()
  .catch(error => { console.error(error); process.exitCode = 1 })
  .finally(async () => { await pool.end() })
