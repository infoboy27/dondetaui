import type { Pool } from 'pg'

// A CLI that dies before inserting its ingestion_runs row (browser launch,
// discovery finding nothing, the site blocking us) used to leave no trace at
// all -- the health report only noticed 30 h later. Record it as a failed run
// so /api/health/ingestion shows the error right away.
export async function recordEarlyFailure(pool: Pool, source: string, error: unknown): Promise<void> {
  const message = (error instanceof Error ? error.message : String(error)).slice(0, 4_000)
  try {
    await pool.query(
      `insert into ingestion_runs(source, status, error_message, finished_at)
       values ($1, 'failed', $2, now())`,
      [source, message],
    )
  } catch (recordError) {
    console.error(`[${source}] could not record the failed run:`, recordError)
  }
}
