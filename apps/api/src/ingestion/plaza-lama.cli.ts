import { Pool } from 'pg'
import { IngestionRepository } from './ingestion.repository'
import { PlazaLamaAdapter } from './plaza-lama.adapter'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const urls = (process.env.PLAZA_LAMA_URLS ?? '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean)

if (!urls.length) {
  throw new Error('PLAZA_LAMA_URLS is required (comma-separated product URLs)')
}

const pool = new Pool({ connectionString: databaseUrl, max: 5 })
const adapter = new PlazaLamaAdapter()
const repository = new IngestionRepository(pool)

async function main() {
  const run = await pool.query<{ id: string }>(
    `insert into ingestion_runs(source, status, items_seen)
     values ('plaza-lama-html', 'running', $1)
     returning id::text`,
    [urls.length],
  )
  const runId = run.rows[0].id
  let ingested = 0

  try {
    for (const url of urls) {
      const item = await adapter.fetchProduct(url)
      await repository.ingest(item, runId)
      ingested += 1
      console.log(`[plaza-lama] ingested ${item.ean ?? item.externalSku} ${item.name} RD$${item.price}`)
    }

    const retailer = await pool.query<{ id: string }>(
      `select id::text from retailers where slug = 'plaza-lama' limit 1`,
    )

    await pool.query(
      `update ingestion_runs
       set retailer_id = $2,
           status = 'completed',
           items_ingested = $3,
           finished_at = now()
       where id = $1`,
      [runId, retailer.rows[0]?.id ?? null, ingested],
    )

    console.log(`[plaza-lama] completed run ${runId}: ${ingested}/${urls.length}`)
  } catch (error) {
    await pool.query(
      `update ingestion_runs
       set status = 'failed',
           items_ingested = $2,
           error_message = $3,
           finished_at = now()
       where id = $1`,
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
