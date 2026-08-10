import { Pool } from 'pg'
import { IngestionRepository } from './ingestion.repository'
import { RetailerHtmlAdapter } from './retailer.adapter'
import { RETAILER_CONFIGS, type RetailerKey } from './retailer.config'
import { RetailerCatalogDiscovery } from './retailer.discovery'

const key = process.argv[2] as RetailerKey | undefined
if (!key || !(key in RETAILER_CONFIGS)) {
  throw new Error(`Retailer key is required: ${Object.keys(RETAILER_CONFIGS).join(', ')}`)
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const config = RETAILER_CONFIGS[key]
const envPrefix = key.toUpperCase().replace(/-/g, '_')
const explicitUrls = (process.env[`${envPrefix}_URLS`] ?? '').split(',').map(value => value.trim()).filter(Boolean)
const maxPages = Number(process.env[`${envPrefix}_MAX_PAGES`] ?? 150)
const maxProducts = Number(process.env[`${envPrefix}_MAX_PRODUCTS`] ?? 5000)
const discoveryDelayMs = Number(process.env[`${envPrefix}_DISCOVERY_DELAY_MS`] ?? 500)
const productDelayMs = Number(process.env[`${envPrefix}_PRODUCT_DELAY_MS`] ?? 350)

const pool = new Pool({ connectionString: databaseUrl, max: 5 })
const repository = new IngestionRepository(pool)
const adapter = new RetailerHtmlAdapter(config)

const sleep = (ms: number) => ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve()

async function main() {
  const discovered = explicitUrls.length
    ? { productUrls: explicitUrls, pagesVisited: 0, pagesDiscovered: 0 }
    : await new RetailerCatalogDiscovery(config).discover({ maxPages, maxProducts, requestDelayMs: discoveryDelayMs })

  const urls = discovered.productUrls
  if (!urls.length) throw new Error(`${config.name}: no product URLs discovered`)

  const run = await pool.query<{ id: string }>(
    `insert into ingestion_runs(source, status, items_seen)
     values ($1, 'running', $2)
     returning id::text`,
    [`${config.slug}-html`, urls.length],
  )
  const runId = run.rows[0].id
  let ingested = 0
  let skipped = 0

  try {
    for (const [index, url] of urls.entries()) {
      try {
        const item = await adapter.fetchProduct(url)
        await repository.ingest(item, runId)
        ingested += 1
        console.log(`[${config.slug}] ${ingested}/${urls.length} ${item.externalSku} ${item.name} RD$${item.price}`)
      } catch (error) {
        skipped += 1
        console.warn(`[${config.slug}] skipped ${url}: ${error instanceof Error ? error.message : String(error)}`)
      }
      if (index < urls.length - 1) await sleep(productDelayMs)
    }

    const retailer = await pool.query<{ id: string }>('select id::text from retailers where slug = $1 limit 1', [config.slug])
    await pool.query(
      `update ingestion_runs
       set retailer_id = $2, status = 'completed', items_ingested = $3, finished_at = now(),
           error_message = case when $4::int > 0 then $4::text || ' candidates skipped' else null end
       where id = $1`,
      [runId, retailer.rows[0]?.id ?? null, ingested, skipped],
    )
    console.log(`[${config.slug}] completed ${ingested}/${urls.length}; skipped=${skipped}; discoveryPages=${discovered.pagesVisited}`)
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
