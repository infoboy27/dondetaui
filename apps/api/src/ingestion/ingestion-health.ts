import type { Pool } from 'pg'
import { freshOfferSql } from '../common/freshness'

export interface RetailerIngestionHealth {
  retailer: string
  lastStatus: string | null
  lastFinishedAt: string | null
  lastIngested: number
  previousIngested: number | null
  freshOffers: number
  problems: string[]
}

// A run that ingested less than this share of the previous completed run is
// suspicious: the retailer probably changed its markup or started blocking.
const DROP_RATIO = 0.5
const STALE_HOURS = 30

// Per-retailer state of the scrapers: last run, how much it brought in compared
// with the run before, and how many of the retailer's offers are still fresh
// enough to be shown. Runs are matched by retailer_id or by their source
// prefix (sirena-vtex-api, plaza-lama-catalog...): not every CLI records
// retailer_id, and a run that fails early never gets one. Shared by
// /api/health/ingestion and the end-of-cycle report the ingestion worker posts
// to Discord.
export async function ingestionHealth(pool: Pool): Promise<RetailerIngestionHealth[]> {
  const result = await pool.query<{
    retailer: string
    last_status: string | null
    last_finished_at: Date | null
    last_ingested: number | null
    previous_ingested: number | null
    fresh_offers: string
  }>(
    `select
       r.name as retailer,
       last_run.status as last_status,
       coalesce(last_run.finished_at, last_run.started_at) as last_finished_at,
       last_run.items_ingested as last_ingested,
       prev_run.items_ingested as previous_ingested,
       (select count(*) from offers o where o.retailer_id = r.id and ${freshOfferSql('o')})::text as fresh_offers
     from retailers r
     left join lateral (
       select status, finished_at, started_at, items_ingested from ingestion_runs
       where (retailer_id = r.id or source like r.slug || '-%') order by started_at desc limit 1
     ) last_run on true
     left join lateral (
       select items_ingested from ingestion_runs
       where (retailer_id = r.id or source like r.slug || '-%') and status = 'completed'
       order by started_at desc offset 1 limit 1
     ) prev_run on true
     where exists (select 1 from offers o where o.retailer_id = r.id)
     order by r.name`,
  )

  return result.rows.map(row => {
    const problems: string[] = []
    const lastIngested = row.last_ingested ?? 0
    if (!row.last_status) problems.push('sin corridas registradas')
    else if (row.last_status === 'failed') problems.push('la última corrida falló')
    if (row.last_finished_at && Date.now() - row.last_finished_at.getTime() > STALE_HOURS * 3_600_000) {
      problems.push(`sin corrida en más de ${STALE_HOURS} h`)
    }
    if (row.previous_ingested && row.last_status === 'completed' && lastIngested < row.previous_ingested * DROP_RATIO) {
      problems.push(`trajo ${lastIngested} productos (antes ${row.previous_ingested})`)
    }
    return {
      retailer: row.retailer,
      lastStatus: row.last_status,
      lastFinishedAt: row.last_finished_at?.toISOString() ?? null,
      lastIngested,
      previousIngested: row.previous_ingested,
      freshOffers: Number(row.fresh_offers),
      problems,
    }
  })
}
