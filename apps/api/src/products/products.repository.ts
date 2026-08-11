import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import type { OfferDto, ProductDto } from './products.types'

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
}

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

    return Promise.all(result.rows.map(row => this.hydrateProduct(row)))
  }

  async listPaged(query: string | undefined, page: number, pageSize: number): Promise<{ items: ProductDto[]; total: number }> {
    const { where, params } = this.searchClause(query)

    const countResult = await this.pool.query<{ count: string }>(
      `select count(*)::text as count
      from products p
      join product_variants pv on pv.product_id = p.id and pv.is_primary = true
      join categories c on c.id = p.category_id
      ${where}`,
      params,
    )
    const total = Number(countResult.rows[0]?.count ?? 0)

    const limitParam = params.length + 1
    const offsetParam = params.length + 2
    const result = await this.pool.query<ProductRow>(
      `${this.baseSelect()}
      ${where}
      order by p.name asc
      limit $${limitParam} offset $${offsetParam}`,
      [...params, pageSize, (page - 1) * pageSize],
    )

    const items = await Promise.all(result.rows.map(row => this.hydrateProduct(row)))
    return { items, total }
  }

  private searchClause(query?: string): { where: string; params: unknown[] } {
    if (!query?.trim()) return { where: '', params: [] }
    return {
      where: `where p.name ilike $1 or p.brand ilike $1 or pv.model ilike $1 or c.name ilike $1`,
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
        coalesce(p.previous_price, 0) as previous_price
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
        coalesce(p.previous_price, 0) as previous_price
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
        coalesce(p.previous_price, 0) as previous_price
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

    return result.rows[0] ? this.hydrateProduct(result.rows[0]) : null
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
      `select
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
      order by
        case when o.availability = 'in_stock' then 0 else 1 end,
        (o.price + o.shipping_price) asc`,
      [productId],
    )

    return result.rows.map(row => ({
      store: row.retailer_name,
      abbr: row.retailer_abbr,
      color: row.retailer_color,
      price: Number(row.price),
      shipping: Number(row.shipping_price) === 0 ? 'Gratis' : `RD$${Number(row.shipping_price).toLocaleString('es-DO')}`,
      available: row.availability === 'in_stock',
      updated: this.relativeAge(row.updated_at),
      retailerId: row.retailer_id,
      storeId: row.store_id ?? undefined,
      url: row.url ?? undefined,
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
