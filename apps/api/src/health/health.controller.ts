import { Controller, Get, Inject, Res } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import { ingestionHealth } from '../ingestion/ingestion-health'

@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  @Get()
  async health() {
    const startedAt = Date.now()
    await this.pool.query('select 1')

    return {
      status: 'ok',
      service: 'dondeta-api',
      database: 'ok',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }
  }

  // Per-retailer scraper state; 503 when any retailer needs attention so an
  // uptime probe can alert on it.
  @Get('ingestion')
  async ingestion(@Res({ passthrough: true }) res: { status(code: number): unknown }) {
    const retailers = await ingestionHealth(this.pool)
    const ok = retailers.every(r => r.problems.length === 0)
    if (!ok) res.status(503)
    return { status: ok ? 'ok' : 'degraded', retailers, timestamp: new Date().toISOString() }
  }
}
