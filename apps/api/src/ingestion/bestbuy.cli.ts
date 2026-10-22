import { Pool } from 'pg'
import { IngestionRepository } from './ingestion.repository'
import { BestBuyAdapter } from './bestbuy.adapter'
import { formatPrice } from '../common/currency'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const apiKey = process.env.BESTBUY_API_KEY
if (!apiKey) throw new Error('BESTBUY_API_KEY is required')

const PAGE_SIZE = 100
const maxProducts = Number(process.env.BESTBUY_MAX_PRODUCTS ?? 1500)
const requestDelayMs = Number(process.env.BESTBUY_REQUEST_DELAY_MS ?? 300)
// Appliances, TVs and home audio: the categories DóndeTa compares.
const categoryIds = (process.env.BESTBUY_CATEGORY_IDS ?? 'abcat0900000,abcat0101000').split(',')

const pool = new Pool({ connectionString: databaseUrl, max: 5 })
const repository = new IngestionRepository(pool)
const adapter = new BestBuyAdapter({ apiKey, categoryIds, websiteUrl: 'https://www.bestbuy.com' })

const sleep = (ms: number) => (ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve())

async function main() {
  const run = await pool.query<{ id: string }>(
    `insert into ingestion_runs(source, status, items_seen)
     values ($1, 'running', 0)
     returning id::text`,
    ['bestbuy-products-api'],
  )
  const runId = run.rows[0].id
  let seen = 0
  let ingested = 0
  let skipped = 0

  try {
    let page = 1
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (ingested + skipped >= maxProducts) break
      let result
      try {
        result = await adapter.fetchPage(page, PAGE_SIZE)
      } catch (error) {
        console.warn(`[bestbuy] page fetch failed for page ${page}: ${error instanceof Error ? error.message : String(error)}`)
        break
      }
      if (!result.products.length) break
      seen += result.products.length

      for (const hit of result.products) {
        const item = adapter.normalize(hit)
        if (!item) {
          skipped += 1
          continue
        }
        try {
          await repository.ingest(item, runId)
          ingested += 1
          console.log(`[bestbuy] ${ingested} ${item.externalSku} ${item.name} ${formatPrice(item.price)}`)
        } catch (error) {
          skipped += 1
          console.warn(`[bestbuy] skipped ${hit.sku}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      page += 1
      if (page > result.totalPages) break
      await sleep(requestDelayMs)
    }

    await pool.query(
      `update ingestion_runs
       set status = 'completed', items_seen = $2, items_ingested = $3, finished_at = now(),
           error_message = case when $4::int > 0 then $4::text || ' candidates skipped' else null end
       where id = $1`,
      [runId, seen, ingested, skipped],
    )
    console.log(`[bestbuy] completed ${ingested}/${seen}; skipped=${skipped}`)
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
