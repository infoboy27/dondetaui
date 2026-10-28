import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import { formatPrice } from '../common/currency'
import { freshOfferSql } from '../common/freshness'
import type { OfferDto, ProductDto } from './products.types'
import type { OfferSeries } from './price-check'

interface ProductRow {
  id: string
  slug: string
  name: string
  brand: string
  model: string
  subtitle: string
  image_url: string | null
  rating: string | number | null
  reviews: number | null
  category: string
  category_id: string
  discount: number | null
  previous_price: string | number | null
  specs: Record<string, string> | null
}

const LIST_HISTORY_DAYS = 30

@Injectable()
export class ProductsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  // Unpaginated: returns every matching row, no cap. Used by callers that
  // need the whole catalog for local lookups (matching favorites/alerts by
  // id, resolving a slug) rather than rendering a browsable list -- those
  // must never silently miss an item that happens to fall past a page
  // boundary.
  async list(query?: string): Promise<ProductDto[]> {
    const { where, params } = this.searchClause(query)

    const result = await this.pool.query<ProductRow>(
      `${this.baseSelect()}
      ${where}
      order by p.name asc`,
      params,
    )
    if (!result.rows.length) return []

    // Bulk-fetch offers/history for every row in two queries instead of
    // hydrateProduct's per-product pair -- with a few hundred products that
    // N+1 pattern was fine, but at a few thousand (multi-country catalogs)
    // it opened thousands of pool connections at once and the endpoint
    // started timing out client-side.
    const productIds = result.rows.map(row => row.id)
    const [offersByProduct, historyByProduct] = await Promise.all([
      this.bulkOffers(productIds),
      this.bulkHistory(productIds),
    ])

    return result.rows.map(row =>
      this.mapProduct(row, offersByProduct.get(row.id) ?? [], historyByProduct.get(row.id) ?? []),
    )
  }

  private async bulkOffers(productIds: string[]): Promise<Map<string, OfferDto[]>> {
    const result = await this.pool.query<{
      product_id: string
      retailer_id: string
      store_id: string | null
      retailer_name: string
      retailer_abbr: string
      retailer_color: string
      price: string
      shipping_price: string
      availability: string
      updated_at: Date
      url: string | null
    }>(
      // One row per retailer: a store that lists the same product twice
      // (duplicate listings get merged into one product) shows its best offer.
      `select * from (select distinct on (pv.product_id, r.id)
        pv.product_id::text as product_id,
        r.id::text as retailer_id,
        s.id::text as store_id,
        r.name as retailer_name,
        r.abbr as retailer_abbr,
        r.primary_color as retailer_color,
        o.price,
        o.shipping_price,
        o.availability,
        o.last_seen_at as updated_at,
        o.url
      from offers o
      join product_variants pv on pv.id = o.product_variant_id
      join retailers r on r.id = o.retailer_id
      left join stores s on s.id = o.store_id
      where pv.product_id = any($1::uuid[])
        and ${freshOfferSql()}
      order by
        pv.product_id, r.id,
        case when o.availability = 'in_stock' then 0 else 1 end,
        (o.price + o.shipping_price) asc) best
      order by
        product_id,
        case when availability = 'in_stock' then 0 else 1 end,
        (price + shipping_price) asc`,
      [productIds],
    )

    const byProduct = new Map<string, OfferDto[]>()
    for (const row of result.rows) {
      const offer: OfferDto = {
        store: row.retailer_name,
        abbr: row.retailer_abbr,
        color: row.retailer_color,
        price: Number(row.price),
        shipping: Number(row.shipping_price) === 0 ? 'Gratis' : formatPrice(Number(row.shipping_price)),
        available: row.availability === 'in_stock',
        updated: this.relativeAge(row.updated_at),
        retailerId: row.retailer_id,
        storeId: row.store_id ?? undefined,
        url: row.url ?? undefined,
      }
      const list = byProduct.get(row.product_id)
      if (list) list.push(offer)
      else byProduct.set(row.product_id, [offer])
    }
    return byProduct
  }

  private async bulkHistory(productIds: string[]): Promise<Map<string, Array<{ date: string; price: number }>>> {
    const result = await this.pool.query<{ product_id: string; date: string; price: string }>(
      `select
        pv.product_id::text as product_id,
        po.observed_at::date::text as date,
        min(po.price + po.shipping_price)::text as price
      from price_observations po
      join offers o on o.id = po.offer_id
      join product_variants pv on pv.id = o.product_variant_id
      where pv.product_id = any($1::uuid[])
        -- Listings only need recent points (price-drop badges); the product
        -- page fetches its full history by slug. Unbounded, this grew every
        -- day and was already half of the 1 MB catalog payload.
        and po.observed_at > now() - interval '${LIST_HISTORY_DAYS} days'
      group by pv.product_id, po.observed_at::date
      order by pv.product_id, po.observed_at::date asc`,
      [productIds],
    )

    const byProduct = new Map<string, Array<{ date: string; price: number }>>()
    for (const row of result.rows) {
      const point = { date: row.date, price: Number(row.price) }
      const list = byProduct.get(row.product_id)
      if (list) list.push(point)
      else byProduct.set(row.product_id, [point])
    }
    return byProduct
  }

  // Listings only include products with at least one current offer -- a
  // product whose every offer went stale has no price to show.
  private searchClause(query?: string): { where: string; params: unknown[] } {
    const hasFreshOffer = `exists (
        select 1 from offers o
        join product_variants fv on fv.id = o.product_variant_id
        where fv.product_id = p.id and ${freshOfferSql()}
      )`
    if (!query?.trim()) return { where: `where ${hasFreshOffer}`, params: [] }
    return {
      where: `where ${hasFreshOffer}
        and (p.name ilike $1 or p.brand ilike $1 or pv.model ilike $1 or c.name ilike $1)`,
      params: [`%${query.trim()}%`],
    }
  }

  private baseSelect(): string {
    return `select
        p.id::text,
        p.slug,
        p.name,
        p.brand,
        pv.model,
        coalesce(p.subtitle, '') as subtitle,
        p.image_url,
        coalesce(rv.average, 0) as rating,
        coalesce(rv.count, 0) as reviews,
        c.name as category,
        c.slug as category_id,
        coalesce(p.discount, 0) as discount,
        coalesce(p.previous_price, 0) as previous_price,
        pv.attributes as specs
      from products p
      join product_variants pv on pv.product_id = p.id and pv.is_primary = true
      join categories c on c.id = p.category_id
      left join (
        select product_id, avg(rating) as average, count(*) as count
        from product_reviews
        group by product_id
      ) rv on rv.product_id = p.id`
  }

  async findById(id: string): Promise<ProductDto | null> {
    const result = await this.pool.query<ProductRow>(
      `select
        p.id::text,
        p.slug,
        p.name,
        p.brand,
        pv.model,
        coalesce(p.subtitle, '') as subtitle,
        p.image_url,
        coalesce(rv.average, 0) as rating,
        coalesce(rv.count, 0) as reviews,
        c.name as category,
        c.slug as category_id,
        coalesce(p.discount, 0) as discount,
        coalesce(p.previous_price, 0) as previous_price,
        pv.attributes as specs
      from products p
      join product_variants pv on pv.product_id = p.id and pv.is_primary = true
      join categories c on c.id = p.category_id
      left join (
        select product_id, avg(rating) as average, count(*) as count
        from product_reviews
        group by product_id
      ) rv on rv.product_id = p.id
      where p.id = $1
      limit 1`,
      [id],
    )

    return result.rows[0] ? this.hydrateProduct(result.rows[0]) : null
  }

  async findBySlug(slug: string): Promise<ProductDto | null> {
    const result = await this.pool.query<ProductRow>(
      `select
        p.id::text,
        p.slug,
        p.name,
        p.brand,
        pv.model,
        coalesce(p.subtitle, '') as subtitle,
        p.image_url,
        coalesce(rv.average, 0) as rating,
        coalesce(rv.count, 0) as reviews,
        c.name as category,
        c.slug as category_id,
        coalesce(p.discount, 0) as discount,
        coalesce(p.previous_price, 0) as previous_price,
        pv.attributes as specs
      from products p
      join product_variants pv on pv.product_id = p.id and pv.is_primary = true
      join categories c on c.id = p.category_id
      left join (
        select product_id, avg(rating) as average, count(*) as count
        from product_reviews
        group by product_id
      ) rv on rv.product_id = p.id
      where p.slug = $1
      limit 1`,
      [slug],
    )

    if (result.rows[0]) return this.hydrateProduct(result.rows[0])

    // Slug of a product merged into another (merge-products.cli.ts): resolve
    // to the survivor, whose own slug tells callers where to redirect.
    const redirect = await this.pool.query<{ product_id: string }>(
      'select product_id::text from product_slug_redirects where old_slug = $1',
      [slug],
    )
    return redirect.rows[0] ? this.findById(redirect.rows[0].product_id) : null
  }

  async findByBarcode(code: string): Promise<ProductDto | null> {
    const result = await this.pool.query<{ product_id: string }>(
      `select product_id::text
      from product_variants
      where ean = $1 or upc = $1
      limit 1`,
      [code],
    )

    return result.rows[0] ? this.findById(result.rows[0].product_id) : null
  }

  async offers(productId: string): Promise<OfferDto[]> {
    const result = await this.pool.query<{
      retailer_id: string
      store_id: string | null
      retailer_name: string
      retailer_abbr: string
      retailer_color: string
      price: string
      shipping_price: string
      availability: string
      updated_at: Date
      url: string | null
    }>(
      `select * from (select distinct on (r.id)
        r.id::text as retailer_id,
        s.id::text as store_id,
        r.name as retailer_name,
        r.abbr as retailer_abbr,
        r.primary_color as retailer_color,
        o.price,
        o.shipping_price,
        o.availability,
        o.last_seen_at as updated_at,
        o.url
      from offers o
      join product_variants pv on pv.id = o.product_variant_id
      join retailers r on r.id = o.retailer_id
      left join stores s on s.id = o.store_id
      where pv.product_id = $1
        and ${freshOfferSql()}
      order by
        r.id,
        case when o.availability = 'in_stock' then 0 else 1 end,
        (o.price + o.shipping_price) asc) best
      order by
        case when availability = 'in_stock' then 0 else 1 end,
        (price + shipping_price) asc`,
      [productId],
    )

    return result.rows.map(row => ({
      store: row.retailer_name,
      abbr: row.retailer_abbr,
      color: row.retailer_color,
      price: Number(row.price),
      shipping: Number(row.shipping_price) === 0 ? 'Gratis' : formatPrice(Number(row.shipping_price)),
      available: row.availability === 'in_stock',
      updated: this.relativeAge(row.updated_at),
      retailerId: row.retailer_id,
      storeId: row.store_id ?? undefined,
      url: row.url ?? undefined,
    }))
  }

  // Every live, in-stock offer with its daily lowest price in that store over
  // the previous 30 days (today excluded), for the price check (price-check.ts).
  async priceCheckSeries(): Promise<OfferSeries[]> {
    const result = await this.pool.query<{
      product_id: string
      name: string
      slug: string
      image_url: string | null
      store: string
      current: string
      points: Array<{ date: string; price: string | number }>
    }>(
      `select
        p.id::text as product_id,
        p.name,
        p.slug,
        p.image_url,
        r.name as store,
        (o.price + o.shipping_price)::text as current,
        coalesce((
          select json_agg(json_build_object('date', d.day, 'price', d.price) order by d.day)
          from (
            select po.observed_at::date::text as day, min(po.price + po.shipping_price) as price
            from price_observations po
            where po.offer_id = o.id
              and po.observed_at >= current_date - 30
              and po.observed_at < current_date
            group by po.observed_at::date
          ) d
        ), '[]'::json) as points
      from offers o
      join product_variants pv on pv.id = o.product_variant_id
      join products p on p.id = pv.product_id
      join retailers r on r.id = o.retailer_id
      where o.availability = 'in_stock'
        and ${freshOfferSql()}`,
    )
    return result.rows.map(row => ({
      productId: row.product_id,
      productName: row.name,
      productSlug: row.slug,
      image: row.image_url ?? '',
      store: row.store,
      current: Number(row.current),
      points: row.points.map(point => ({ date: point.date, price: Number(point.price) })),
    }))
  }

  async history(productId: string): Promise<Array<{ date: string; price: number }>> {
    const result = await this.pool.query<{ date: string; price: string }>(
      `select
        po.observed_at::date::text as date,
        min(po.price + po.shipping_price)::text as price
      from price_observations po
      join offers o on o.id = po.offer_id
      join product_variants pv on pv.id = o.product_variant_id
      where pv.product_id = $1
      group by po.observed_at::date
      order by po.observed_at::date asc`,
      [productId],
    )

    return result.rows.map(row => ({ date: row.date, price: Number(row.price) }))
  }

  private async hydrateProduct(row: ProductRow): Promise<ProductDto> {
    const [prices, priceHistory] = await Promise.all([this.offers(row.id), this.history(row.id)])
    return this.mapProduct(row, prices, priceHistory)
  }

  private mapProduct(row: ProductRow, prices: OfferDto[], priceHistory: Array<{ date: string; price: number }>): ProductDto {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      model: row.model,
      subtitle: row.subtitle,
      image: row.image_url ?? '',
      rating: Number(row.rating ?? 0),
      reviews: row.reviews ?? 0,
      category: row.category,
      categoryId: row.category_id,
      discount: row.discount ?? 0,
      previousPrice: Number(row.previous_price ?? 0),
      prices,
      priceHistory,
      specs: row.specs ?? {},
    }
  }

  private relativeAge(value: Date): string {
    const seconds = Math.max(0, Math.floor((Date.now() - value.getTime()) / 1000))
    if (seconds < 60) return `${seconds} seg`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hora${hours === 1 ? '' : 's'}`
    const days = Math.floor(hours / 24)
    return `${days} día${days === 1 ? '' : 's'}`
  }
}
