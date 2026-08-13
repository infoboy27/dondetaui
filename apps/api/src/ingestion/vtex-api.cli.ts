import { Pool } from 'pg'
import { IngestionRepository } from './ingestion.repository'
import { VtexApiAdapter } from './vtex-api.adapter'
import { VTEX_RETAILER_CONFIGS } from './vtex-api.config'
import { formatPrice } from '../common/currency'

const key = process.argv[2]
if (!key || !(key in VTEX_RETAILER_CONFIGS)) {
  throw new Error(`Retailer key is required: ${Object.keys(VTEX_RETAILER_CONFIGS).join(', ')}`)
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const config = VTEX_RETAILER_CONFIGS[key]
const envPrefix = key.toUpperCase().replace(/-/g, '_')
// VTEX rejects ranges wider than 50 in one call; 49 keeps `to - from` at
// the limit while staying 0-indexed-inclusive correct.
const PAGE_SIZE = 49
const maxProducts = Number(process.env[`${envPrefix}_MAX_PRODUCTS`] ?? 1000)
const requestDelayMs = Number(process.env[`${envPrefix}_REQUEST_DELAY_MS`] ?? 500)

const pool = new Pool({ connectionString: databaseUrl, max: 5 })
const repository = new IngestionRepository(pool)
const adapter = new VtexApiAdapter(config)

const sleep = (ms: number) => (ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve())

async function main() {
  const run = await pool.query<{ id: string }>(
    `insert into ingestion_runs(source, status, items_seen)
     values ($1, 'running', 0)
     returning id::text`,
    [`${config.slug}-vtex-api`],
  )
  const runId = run.rows[0].id
  let seen = 0
  let ingested = 0
  let skipped = 0

  try {
    for (const categoryPath of config.categoryPaths) {
      let from = 0
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (ingested + skipped >= maxProducts) break
        const to = from + PAGE_SIZE
        let products
        try {
          products = await adapter.fetchPage(categoryPath, from, to)
        } catch (error) {
          console.warn(`[${config.slug}] page fetch failed for ${categoryPath} [${from}-${to}]: ${error instanceof Error ? error.message : String(error)}`)
          break
        }
        if (!products.length) break
        seen += products.length

        for (const product of products) {
          const item = adapter.normalize(product)
          if (!item) {
            skipped += 1
            continue
          }
          try {
            await repository.ingest(item, runId)
            ingested += 1
            console.log(`[${config.slug}] ${ingested} ${item.externalSku} ${item.name} ${formatPrice(item.price)}`)
          } catch (error) {
            skipped += 1
            console.warn(`[${config.slug}] skipped ${product.productId}: ${error instanceof Error ? error.message : String(error)}`)
          }
        }

        if (products.length < PAGE_SIZE + 1) break // last page
        from += PAGE_SIZE + 1
        await sleep(requestDelayMs)
      }
    }

    await pool.query(
      `update ingestion_runs
       set status = 'completed', items_seen = $2, items_ingested = $3, finished_at = now(),
           error_message = case when $4::int > 0 then $4::text || ' candidates skipped' else null end
       where id = $1`,
      [runId, seen, ingested, skipped],
    )
    console.log(`[${config.slug}] completed ${ingested}/${seen}; skipped=${skipped}`)
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
