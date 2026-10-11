import { Pool } from 'pg'

// Called at the top of every ingestion cycle (deploy/ingestion-loop*.sh) with
// the stack's retailer slugs; prints them oldest-data-first, one per line.
//
// Every deploy restarts the worker, and the loop used to always start at the
// same retailer -- on a day of several deploys the last ones in the list
// (Jumbo) never got their turn. Starting with whoever was refreshed longest
// ago makes progress regardless of restarts.
//
// It also closes runs a restart cut off: nothing else runs at this point, so
// any 'running' row of these retailers is an interrupted run.
const slugs = process.argv.slice(2)
const databaseUrl = process.env.DATABASE_URL

async function main() {
  if (!databaseUrl || !slugs.length) {
    console.log(slugs.join('\n'))
    return
  }
  const pool = new Pool({ connectionString: databaseUrl, max: 1 })
  try {
    await pool.query(
      `update ingestion_runs
       set status = 'failed', finished_at = now(),
           error_message = coalesce(error_message || ' | ', '') || 'interrumpida por un reinicio del worker'
       where status = 'running' and exists (select 1 from unnest($1::text[]) s where source like s || '-%')`,
      [slugs],
    )
    const result = await pool.query<{ slug: string; last: Date | null }>(
      `select s as slug,
         (select max(coalesce(finished_at, started_at)) from ingestion_runs r
          where r.source like s || '-%' and r.status = 'completed' and r.items_ingested > 0) as last
       from unnest($1::text[]) s`,
      [slugs],
    )
    const order = result.rows
      .sort((a, b) => (a.last?.getTime() ?? 0) - (b.last?.getTime() ?? 0))
      .map(row => row.slug)
    console.log(order.join('\n'))
  } finally {
    await pool.end()
  }
}

main().catch(error => {
  // Never block ingestion over ordering: fall back to the given order.
  console.error('[order] failed, using default order:', error instanceof Error ? error.message : error)
  console.log(slugs.join('\n'))
})
