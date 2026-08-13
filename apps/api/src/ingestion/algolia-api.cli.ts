import { Pool } from 'pg'
import { IngestionRepository } from './ingestion.repository'
import { AlgoliaApiAdapter } from './algolia-api.adapter'
import { ALGOLIA_RETAILER_CONFIGS } from './algolia-api.config'
import { formatPrice } from '../common/currency'

const key = process.argv[2]
if (!key || !(key in ALGOLIA_RETAILER_CONFIGS)) {
  throw new Error(`Retailer key is required: ${Object.keys(ALGOLIA_RETAILER_CONFIGS).join(', ')}`)
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const config = ALGOLIA_RETAILER_CONFIGS[key]
const envPrefix = key.toUpperCase().replace(/-/g, '_')
const HITS_PER_PAGE = 100
const maxProducts = Number(process.env[`${envPrefix}_MAX_PRODUCTS`] ?? 1000)
const requestDelayMs = Number(process.env[`${envPrefix}_REQUEST_DELAY_MS`] ?? 500)

const pool = new Pool({ connectionString: databaseUrl, max: 5 })
const repository = new IngestionRepository(pool)
const adapter = new AlgoliaApiAdapter(config)

const sleep = (ms: number) => (ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve())

async function main() {
  const run = await pool.query<{ id: string }>(
    `insert into ingestion_runs(source, status, items_seen)
     values ($1, 'running', 0)
     returning id::text`,
    [`${config.slug}-algolia-api`],
  )
  const runId = run.rows[0].id
  let seen = 0
  let ingested = 0
  let skipped = 0

  try {
    let page = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (ingested + skipped >= maxProducts) break
      let result
      try {
        result = await adapter.fetchPage(page, HITS_PER_PAGE)
      } catch (error) {
        console.warn(`[${config.slug}] page fetch failed for page ${page}: ${error instanceof Error ? error.message : String(error)}`)
        break
      }
      if (!result.hits.length) break
      seen += result.hits.length

      for (const hit of result.hits) {
        const item = adapter.normalize(hit)
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
          console.warn(`[${config.slug}] skipped ${hit.objectID}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      page += 1
      if (page >= result.nbPages) break
      await sleep(requestDelayMs)
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
