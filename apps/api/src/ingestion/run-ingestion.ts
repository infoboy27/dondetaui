import { Pool } from 'pg'
import { IngestionRepository } from './ingestion.repository'
import { recordEarlyFailure } from './ingestion-runs'
import { formatPrice } from '../common/currency'
import type { NormalizedRetailerItem } from './ingestion.types'

// Shared by the Cecomsa and Shopify CLIs: records an ingestion run, ingests every
// item the source yields and closes the run. `items` yields null for products it
// chose to skip (counted, not an error); it calls onSeen() once per candidate.
export async function runIngestion(
  source: string,
  items: (onSeen: () => void) => AsyncIterable<NormalizedRetailerItem | null>,
): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required')
  const pool = new Pool({ connectionString: databaseUrl, max: 3 })
  const repository = new IngestionRepository(pool)
  let runId: string | null = null
  let seen = 0
  let ingested = 0
  let skipped = 0

  try {
    const run = await pool.query<{ id: string }>(
      `insert into ingestion_runs(source, status, items_seen) values ($1, 'running', 0) returning id::text`,
      [source],
    )
    runId = run.rows[0]!.id

    for await (const item of items(() => { seen += 1 })) {
      if (!item) {
        skipped += 1
        continue
      }
      try {
        await repository.ingest(item, runId)
        ingested += 1
        console.log(`[${source}] ${ingested} ${item.externalSku} ${item.name} ${formatPrice(item.price)}`)
      } catch (error) {
        skipped += 1
        console.warn(`[${source}] skipped ${item.externalSku}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    if (ingested === 0) throw new Error(`${source}: no products ingested (the site may have changed or is blocking us)`)
    await pool.query(
      `update ingestion_runs
       set status = 'completed', items_seen = $2, items_ingested = $3, finished_at = now(),
           error_message = case when $4::int > 0 then $4::text || ' candidates skipped' else null end
       where id = $1`,
      [runId, seen, ingested, skipped],
    )
    console.log(`[${source}] completed ${ingested}/${seen}; skipped=${skipped}`)
  } catch (error) {
    if (runId) {
      await pool.query(
        `update ingestion_runs set status = 'failed', items_ingested = $2, error_message = $3, finished_at = now() where id = $1`,
        [runId, ingested, (error instanceof Error ? error.message : String(error)).slice(0, 4_000)],
      )
    } else {
      await recordEarlyFailure(pool, source, error)
    }
    throw error
  } finally {
    await pool.end()
  }
}
