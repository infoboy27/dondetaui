import { Controller, Get, Headers, Inject, NotFoundException, Param, ParseUUIDPipe, Query, Redirect } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import { freshOfferSql } from '../common/freshness'

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|curl|wget|python|axios/i
const SOURCES = new Set(['web', 'seo', 'app'])

@Controller('go')
export class OutboundController {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  // /api/go/:productId/:retailerId?src=web|seo|app -- logs the click, then
  // 302s to that retailer's current offer page. Keyed by product+retailer
  // (both already in every OfferDto) rather than an offer id, so the link
  // stays valid when ingestion replaces the offer row.
  @Get(':productId/:retailerId')
  @Redirect()
  async go(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('retailerId', ParseUUIDPipe) retailerId: string,
    @Query('src') src = 'web',
    @Headers('user-agent') userAgent = '',
    @Headers('referer') referer = '',
  ) {
    const offer = await this.pool.query<{ url: string }>(
      `select o.url
       from offers o
       join product_variants pv on pv.id = o.product_variant_id
       where pv.product_id = $1 and o.retailer_id = $2 and o.url is not null
       order by (${freshOfferSql()}) desc, o.last_seen_at desc
       limit 1`,
      [productId, retailerId],
    )
    const url = offer.rows[0]?.url
    if (!url) throw new NotFoundException()

    // Never block the redirect on the analytics write.
    this.pool
      .query(
        `insert into outbound_clicks(product_id, retailer_id, source, is_bot, referer, user_agent)
         values ($1, $2, $3, $4, $5, $6)`,
        [productId, retailerId, SOURCES.has(src) ? src : 'web', BOT_UA.test(userAgent), referer.slice(0, 500) || null, userAgent.slice(0, 500) || null],
      )
      .catch(error => console.warn(`[outbound] click not recorded: ${error instanceof Error ? error.message : String(error)}`))

    return { url, statusCode: 302 }
  }
}
