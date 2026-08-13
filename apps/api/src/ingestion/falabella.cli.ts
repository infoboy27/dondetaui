import { Pool } from 'pg'
import { IngestionRepository } from './ingestion.repository'
import { FalabellaAdapter } from './falabella.adapter'
import { FALABELLA_CONFIGS } from './falabella.config'
import { formatPrice } from '../common/currency'

const key = process.argv[2]
if (!key || !(key in FALABELLA_CONFIGS)) {
  throw new Error(`Retailer key is required: ${Object.keys(FALABELLA_CONFIGS).join(', ')}`)
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const config = FALABELLA_CONFIGS[key]
const envPrefix = key.toUpperCase().replace(/-/g, '_')
const maxProductsPerTerm = Number(process.env[`${envPrefix}_MAX_PRODUCTS_PER_TERM`] ?? 150)
const requestDelayMs = Number(process.env[`${envPrefix}_REQUEST_DELAY_MS`] ?? 800)

const pool = new Pool({ connectionString: databaseUrl, max: 5 })
const repository = new IngestionRepository(pool)
const adapter = new FalabellaAdapter(config)

const sleep = (ms: number) => (ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve())

async function main() {
  const run = await pool.query<{ id: string }>(
    `insert into ingestion_runs(source, status, items_seen)
     values ($1, 'running', 0)
     returning id::text`,
    [`${config.slug}-nextdata`],
  )
  const runId = run.rows[0].id
  let seen = 0
  let ingested = 0
  let skipped = 0
  const seenSkus = new Set<string>()

  try {
    for (const term of config.searchTerms) {
      let page = 1
      let termCount = 0
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (termCount >= maxProductsPerTerm) break
        let pageProps
        try {
          pageProps = await adapter.fetchPage(term, page)
        } catch (error) {
          console.warn(`[${config.slug}] page fetch failed for "${term.query}" page ${page}: ${error instanceof Error ? error.message : String(error)}`)
          break
        }
        if (!pageProps.results.length) break
        seen += pageProps.results.length

        for (const result of pageProps.results) {
          // The same product can surface under multiple search terms
          // (e.g. a combo washer/dryer under both "lavadora" and
          // "secadora de ropa") -- skip repeats within this run instead
          // of re-ingesting/logging them twice.
          if (seenSkus.has(result.productId)) continue

          const item = adapter.normalize(result, term)
          if (!item) {
            skipped += 1
            continue
          }
          try {
            await repository.ingest(item, runId)
            seenSkus.add(result.productId)
            ingested += 1
            termCount += 1
            console.log(`[${config.slug}] ${ingested} ${item.externalSku} ${item.name} ${formatPrice(item.price)}`)
          } catch (error) {
            skipped += 1
            console.warn(`[${config.slug}] skipped ${result.productId}: ${error instanceof Error ? error.message : String(error)}`)
          }
        }

        const pagination = pageProps.pagination
        const totalPages = pagination ? Math.ceil(pagination.count / pagination.perPage) : page
        page += 1
        if (page > totalPages) break
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
