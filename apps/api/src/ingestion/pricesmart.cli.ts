import { Pool } from 'pg'
import { chromium } from 'playwright'
import { IngestionRepository } from './ingestion.repository'
import { PriceSmartAdapter } from './pricesmart.adapter'
import { PriceSmartCatalogDiscovery } from './pricesmart.discovery'
import { formatPrice } from '../common/currency'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

function csv(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative number`)
  }
  return parsed
}

async function delay(ms: number) {
  if (ms <= 0) return
  await new Promise(resolve => setTimeout(resolve, ms))
}

const pool = new Pool({ connectionString: databaseUrl, max: 5 })
const repository = new IngestionRepository(pool)

async function resolveUrls(discovery: PriceSmartCatalogDiscovery): Promise<string[]> {
  const explicitUrls = csv(process.env.PRICESMART_URLS)
  if (explicitUrls.length) {
    console.log(`[pricesmart] using ${explicitUrls.length} explicitly configured product URLs`)
    return [...new Set(explicitUrls)]
  }

  const seedUrls = csv(process.env.PRICESMART_CATEGORY_URLS)
  const result = await discovery.discover({
    seedUrls: seedUrls.length ? seedUrls : undefined,
    maxCategoryPages: numberFromEnv('PRICESMART_MAX_PAGES', 20),
    maxProducts: numberFromEnv('PRICESMART_MAX_PRODUCTS', 300),
    requestDelayMs: numberFromEnv('PRICESMART_DISCOVERY_DELAY_MS', 500),
  })

  console.log(
    `[pricesmart] discovery visited ${result.categoryPagesVisited} category pages, ` +
    `discovered ${result.categoryPagesDiscovered} category URLs and ${result.productUrls.length} product candidates`,
  )

  if (!result.productUrls.length) {
    throw new Error('PriceSmart catalog discovery found no product URLs')
  }

  return result.productUrls
}

async function main() {
  // Same rationale as plaza-lama.cli.ts: Chromium via apt in the ingestion-worker
  // container (Dockerfile.ingestion), Playwright's own managed browser locally.
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  })
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (compatible; DondeTaPriceIndexer/0.3; +https://dondeta.app)',
  })
  const adapter = new PriceSmartAdapter(page)
  const discovery = new PriceSmartCatalogDiscovery(page)

  let urls: string[]
  try {
    urls = await resolveUrls(discovery)
  } catch (error) {
    await browser.close()
    throw error
  }

  const productDelayMs = numberFromEnv('PRICESMART_PRODUCT_DELAY_MS', 350)

  const run = await pool.query<{ id: string }>(
    `insert into ingestion_runs(source, status, items_seen)
     values ('pricesmart-catalog', 'running', $1)
     returning id::text`,
    [urls.length],
  )
  const runId = run.rows[0].id
  let ingested = 0
  const failures: string[] = []

  try {
    for (const [index, url] of urls.entries()) {
      try {
        const item = await adapter.fetchProduct(url)
        await repository.ingest(item, runId)
        ingested += 1
        console.log(
          `[pricesmart] ${index + 1}/${urls.length} ingested ${item.externalSku} ${item.name} ${formatPrice(item.price)}`,
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        failures.push(`${url}: ${message}`)
        console.warn(`[pricesmart] ${index + 1}/${urls.length} skipped ${url}: ${message}`)
      }

      if (index < urls.length - 1) {
        await delay(productDelayMs)
      }
    }

    const retailer = await pool.query<{ id: string }>(
      `select id::text from retailers where slug = 'pricesmart' limit 1`,
    )

    const status = ingested > 0 ? 'completed' : 'failed'
    const errorMessage = failures.length
      ? `${failures.length} item(s) skipped. ${failures.slice(0, 10).join(' | ')}`.slice(0, 4_000)
      : null

    await pool.query(
      `update ingestion_runs
       set retailer_id = $2,
           status = $3,
           items_ingested = $4,
           error_message = $5,
           finished_at = now()
       where id = $1`,
      [runId, retailer.rows[0]?.id ?? null, status, ingested, errorMessage],
    )

    console.log(
      `[pricesmart] completed run ${runId}: ${ingested}/${urls.length} ingested, ${failures.length} skipped`,
    )

    if (ingested === 0) {
      throw new Error('PriceSmart ingestion completed without ingesting any products')
    }
  } catch (error) {
    await pool.query(
      `update ingestion_runs
       set status = 'failed',
           items_ingested = $2,
           error_message = $3,
           finished_at = now()
       where id = $1 and status = 'running'`,
      [runId, ingested, error instanceof Error ? error.message : String(error)],
    )
    throw error
  } finally {
    await browser.close()
  }
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
