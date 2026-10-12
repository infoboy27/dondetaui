import { BadRequestException, Controller, Get, Inject, NotFoundException, Param, Query, Res, UseGuards } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import { ingestionHealth } from '../ingestion/ingestion-health'
import { AdminGuard } from './admin.guard'
import { AdminRepository } from './admin.repository'
import { analyticsConfigured, analyticsSummary, campaignReport } from './google-analytics'

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

  // Traffic and store visits per utm campaign (paid promotions first).
  @Get('campaigns')
  async campaigns(@Query('days') rawDays?: string) {
    const days = periodDays(rawDays)
    if (!analyticsConfigured()) return { days, configured: false, rows: null, error: null }
    try {
      return { days, configured: true, rows: await campaignReport(days), error: null }
    } catch (error) {
      return { days, configured: true, rows: null, error: error instanceof Error ? error.message.slice(0, 300) : String(error) }
    }
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

  // Product photo through the API, so the admin's Instagram card generator can
  // draw it on a <canvas> and still export a PNG (a cross-origin retailer image
  // would taint the canvas). Only images already stored for a product are
  // fetched -- the id is looked up, no arbitrary URL is ever proxied.
  @Get('products/:id/image')
  async productImage(
    @Param('id') id: string,
    @Res() res: { status(code: number): { end(): void }; setHeader(name: string, value: string): void; end(body: Buffer): void },
  ) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BadRequestException('Invalid product id')
    const result = await this.pool.query<{ image_url: string | null }>('select image_url from products where id = $1', [id])
    const url = result.rows[0]?.image_url
    if (!url || !/^https:\/\//i.test(url)) throw new NotFoundException('No image')
    const upstream = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    const type = upstream.headers.get('content-type') ?? ''
    if (!upstream.ok || !type.startsWith('image/')) return res.status(502).end()
    res.setHeader('Content-Type', type)
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.end(Buffer.from(await upstream.arrayBuffer()))
  }
}
