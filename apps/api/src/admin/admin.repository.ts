import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { freshOfferSql } from '../common/freshness'
import { DATABASE_POOL } from '../database/database.module'

export interface ClickSeries {
  total: number
  byDay: Array<{ date: string; clicks: number }>
  bySource: Array<{ label: string; clicks: number }>
  topProducts: Array<{ name: string; slug: string; store: string; clicks: number }>
}

export interface RetailerStats {
  slug: string
  name: string
  abbr: string
  color: string
  websiteUrl: string | null
  products: number
  compared: number
  wins: number
  clicks: number
}

export interface PriceComparison {
  name: string
  slug: string
  image: string | null
  myPrice: number
  otherStore: string
  otherPrice: number
}

export interface RetailerReport {
  retailer: RetailerStats
  clicks: ClickSeries
  categories: Array<{ label: string; products: number }>
  wins: PriceComparison[]
  losses: PriceComparison[]
  avgWinMargin: number
  avgLossGap: number
}

// Best (cheapest) fresh offer per product per retailer -- the unit every
// "who is cheaper" number below is computed from.
const BEST_OFFERS = `
  best as (
    select pv.product_id, o.retailer_id, min(o.price + o.shipping_price)::numeric as total
    from offers o
    join product_variants pv on pv.id = o.product_variant_id
    where ${freshOfferSql('o')}
    group by pv.product_id, o.retailer_id
  ),
  prod as (
    select product_id, count(*) as stores, min(total) as low
    from best group by product_id
  )`

@Injectable()
export class AdminRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async catalog() {
    const result = await this.pool.query<{ products: string; offers: string; compared: string; retailers: string; last_seen: Date | null }>(
      `with ${BEST_OFFERS}
       select
         (select count(*) from prod)::text as products,
         (select count(*) from offers o where ${freshOfferSql('o')})::text as offers,
         (select count(*) from prod where stores > 1)::text as compared,
         (select count(distinct retailer_id) from best)::text as retailers,
         (select max(last_seen_at) from offers) as last_seen`,
    )
    const row = result.rows[0]
    return {
      products: Number(row.products),
      offers: Number(row.offers),
      compared: Number(row.compared),
      retailers: Number(row.retailers),
      lastSeenAt: row.last_seen?.toISOString() ?? null,
    }
  }

  // retailerSlug narrows every number to clicks sent to that one store.
  async clicks(days: number, retailerSlug?: string): Promise<ClickSeries> {
    const params: unknown[] = [days]
    let filter = `not c.is_bot and c.clicked_at > now() - $1 * interval '1 day'`
    if (retailerSlug) {
      params.push(retailerSlug)
      filter += ` and c.retailer_id = (select id from retailers where slug = $2)`
    }

    const [byDay, bySource, top] = await Promise.all([
      this.pool.query<{ date: string; clicks: string }>(
        `select (c.clicked_at at time zone 'America/Santo_Domingo')::date::text as date, count(*)::text as clicks
         from outbound_clicks c where ${filter} group by 1 order by 1`,
        params,
      ),
      this.pool.query<{ label: string; clicks: string }>(
        `select coalesce(c.source, 'web') as label, count(*)::text as clicks
         from outbound_clicks c where ${filter} group by 1 order by 2 desc`,
        params,
      ),
      this.pool.query<{ name: string; slug: string; store: string; clicks: string }>(
        `select p.name, p.slug, r.name as store, count(*)::text as clicks
         from outbound_clicks c
         join products p on p.id = c.product_id
         join retailers r on r.id = c.retailer_id
         where ${filter}
         group by p.name, p.slug, r.name order by count(*) desc limit 10`,
        params,
      ),
    ])

    const series = byDay.rows.map(row => ({ date: row.date, clicks: Number(row.clicks) }))
    return {
      total: series.reduce((sum, point) => sum + point.clicks, 0),
      byDay: fillDays(series, days),
      bySource: bySource.rows.map(row => ({ label: row.label, clicks: Number(row.clicks) })),
      topProducts: top.rows.map(row => ({ ...row, clicks: Number(row.clicks) })),
    }
  }

  async retailers(days: number): Promise<RetailerStats[]> {
    const result = await this.pool.query<{
      slug: string; name: string; abbr: string; color: string; website_url: string | null
      products: string; compared: string; wins: string; clicks: string
    }>(
      `with ${BEST_OFFERS}
       select r.slug, r.name, r.abbr, r.primary_color as color, r.website_url,
         count(b.product_id)::text as products,
         count(*) filter (where p.stores > 1)::text as compared,
         count(*) filter (where p.stores > 1 and b.total = p.low)::text as wins,
         (select count(*) from outbound_clicks c
           where c.retailer_id = r.id and not c.is_bot
             and c.clicked_at > now() - $1 * interval '1 day')::text as clicks
       from retailers r
       join best b on b.retailer_id = r.id
       join prod p on p.product_id = b.product_id
       group by r.id
       order by count(b.product_id) desc`,
      [days],
    )
    return result.rows.map(row => ({
      slug: row.slug,
      name: row.name,
      abbr: row.abbr,
      color: row.color,
      websiteUrl: row.website_url,
      products: Number(row.products),
      compared: Number(row.compared),
      wins: Number(row.wins),
      clicks: Number(row.clicks),
    }))
  }

  async retailerReport(slug: string, days: number): Promise<RetailerReport | null> {
    const retailer = (await this.retailers(days)).find(r => r.slug === slug)
    if (!retailer) return null

    const [clicks, categories, comparisons] = await Promise.all([
      this.clicks(days, slug),
      this.pool.query<{ label: string; products: string }>(
        `with ${BEST_OFFERS}
         select coalesce(c.name, 'Otros') as label, count(*)::text as products
         from best b
         join products p on p.id = b.product_id
         left join categories c on c.id = p.category_id
         where b.retailer_id = (select id from retailers where slug = $1)
         group by 1 order by count(*) desc limit 8`,
        [slug],
      ),
      // For every product this store shares with another store: its price
      // against the cheapest competitor's.
      this.pool.query<{ name: string; slug: string; image: string | null; my_price: string; other_store: string; other_price: string }>(
        `with ${BEST_OFFERS}
         select p.name, p.slug, p.image_url as image, me.total::text as my_price,
           other.name as other_store, other.total::text as other_price
         from best me
         join prod on prod.product_id = me.product_id and prod.stores > 1
         join products p on p.id = me.product_id
         join lateral (
           select r.name, b.total from best b join retailers r on r.id = b.retailer_id
           where b.product_id = me.product_id and b.retailer_id <> me.retailer_id
           order by b.total asc limit 1
         ) other on true
         where me.retailer_id = (select id from retailers where slug = $1)`,
        [slug],
      ),
    ])

    const rows: PriceComparison[] = comparisons.rows.map(row => ({
      name: row.name,
      slug: row.slug,
      image: row.image,
      myPrice: Number(row.my_price),
      otherStore: row.other_store,
      otherPrice: Number(row.other_price),
    }))
    const wins = rows.filter(r => r.myPrice < r.otherPrice).sort((a, b) => (b.otherPrice - b.myPrice) - (a.otherPrice - a.myPrice))
    const losses = rows.filter(r => r.myPrice > r.otherPrice).sort((a, b) => (b.myPrice - b.otherPrice) - (a.myPrice - a.otherPrice))
    const average = (values: number[]) => values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0

    return {
      retailer,
      clicks,
      categories: categories.rows.map(row => ({ label: row.label, products: Number(row.products) })),
      wins: wins.slice(0, 8),
      losses: losses.slice(0, 8),
      avgWinMargin: average(wins.map(r => r.otherPrice - r.myPrice)),
      avgLossGap: average(losses.map(r => r.myPrice - r.otherPrice)),
    }
  }
}

// Every day in the window, zero-filled, so charts don't skip quiet days.
function fillDays(series: Array<{ date: string; clicks: number }>, days: number) {
  const byDate = new Map(series.map(point => [point.date, point.clicks]))
  const out: Array<{ date: string; clicks: number }> = []
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santo_Domingo' }))
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    out.push({ date: key, clicks: byDate.get(key) ?? 0 })
  }
  return out
}
