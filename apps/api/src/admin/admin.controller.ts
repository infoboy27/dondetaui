import { Controller, Get, Inject, NotFoundException, Param, Query, UseGuards } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import { ingestionHealth } from '../ingestion/ingestion-health'
import { AdminGuard } from './admin.guard'
import { AdminRepository } from './admin.repository'
import { analyticsConfigured, analyticsSummary } from './google-analytics'

function periodDays(raw?: string): number {
  const days = Number(raw ?? 30)
  return Number.isFinite(days) ? Math.min(365, Math.max(1, Math.round(days))) : 30
}

// GA4 failures (bad key, API not enabled, quota) must not take the rest of
// the portal down: report them next to the data instead.
async function safeAnalytics(days: number) {
  if (!analyticsConfigured()) return { configured: false, data: null, error: null }
  try {
    return { configured: true, data: await analyticsSummary(days), error: null }
  } catch (error) {
    return { configured: true, data: null, error: error instanceof Error ? error.message.slice(0, 300) : String(error) }
  }
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly admin: AdminRepository,
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  @Get('me')
  me() {
    return { admin: true }
  }

  @Get('overview')
  async overview(@Query('days') rawDays?: string) {
    const days = periodDays(rawDays)
    const [catalog, clicks, retailers, ingestion, analytics] = await Promise.all([
      this.admin.catalog(),
      this.admin.clicks(days),
      this.admin.retailers(days),
      ingestionHealth(this.pool),
      safeAnalytics(days),
    ])
    return { days, generatedAt: new Date().toISOString(), catalog, clicks, retailers, ingestion, analytics }
  }

  @Get('retailers/:slug/report')
  async report(@Param('slug') slug: string, @Query('days') rawDays?: string) {
    const days = periodDays(rawDays)
    const [report, catalog, analytics] = await Promise.all([
      this.admin.retailerReport(slug, days),
      this.admin.catalog(),
      safeAnalytics(days),
    ])
    if (!report) throw new NotFoundException('Retailer not found')
    return { days, generatedAt: new Date().toISOString(), catalog, analytics, ...report }
  }
}
