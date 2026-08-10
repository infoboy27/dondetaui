import { Controller, Get, Inject } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'

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
}
