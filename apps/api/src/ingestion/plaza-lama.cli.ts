import { Pool } from 'pg'
import { IngestionRepository } from './ingestion.repository'
import { PlazaLamaAdapter } from './plaza-lama.adapter'
import { PlazaLamaCatalogDiscovery } from './plaza-lama.discovery'

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
const adapter = new PlazaLamaAdapter()
const discovery = new PlazaLamaCatalogDiscovery()
const repository = new IngestionRepository(pool)

async function resolveUrls(): Promise<string[]> {
  const explicitUrls = csv(process.env.PLAZA_LAMA_URLS)
  if (explicitUrls.length) {
    console.log(`[plaza-lama] using ${explicitUrls.length} explicitly configured product URLs`)
    return [...new Set(explicitUrls)]
  }

  const seedUrls = csv(process.env.PLAZA_LAMA_CATEGORY_URLS)
  const result = await discovery.discover({
    seedUrls: seedUrls.length ? seedUrls : undefined,
    maxCategoryPages: numberFromEnv('PLAZA_LAMA_MAX_CATEGORY_PAGES', 150),
    maxProducts: numberFromEnv('PLAZA_LAMA_MAX_PRODUCTS', 5_000),
    requestDelayMs: numberFromEnv('PLAZA_LAMA_DISCOVERY_DELAY_MS', 500),
  })

  console.log(
    `[plaza-lama] discovery visited ${result.categoryPagesVisited} category pages, ` +
    `discovered ${result.categoryPagesDiscovered} category URLs and ${result.productUrls.length} product candidates`,
  )

  if (!result.productUrls.length) {
    throw new Error('Plaza Lama catalog discovery found no product URLs')
  }

  return result.productUrls
}

async function main() {
  const urls = await resolveUrls()
  const productDelayMs = numberFromEnv('PLAZA_LAMA_PRODUCT_DELAY_MS', 350)

  const run = await pool.query<{ id: string }>(
    `insert into ingestion_runs(source, status, items_seen)
     values ('plaza-lama-catalog', 'running', $1)
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
          `[plaza-lama] ${index + 1}/${urls.length} ingested ` +
          `${item.ean ?? item.externalSku} ${item.name} RD$${item.price}`,
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        failures.push(`${url}: ${message}`)
        console.warn(`[plaza-lama] ${index + 1}/${urls.length} skipped ${url}: ${message}`)
      }

      if (index < urls.length - 1) {
        await delay(productDelayMs)
      }
    }

    const retailer = await pool.query<{ id: string }>(
      `select id::text from retailers where slug = 'plaza-lama' limit 1`,
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
      `[plaza-lama] completed run ${runId}: ${ingested}/${urls.length} ingested, ${failures.length} skipped`,
    )

    if (ingested === 0) {
      throw new Error('Plaza Lama ingestion completed without ingesting any products')
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
