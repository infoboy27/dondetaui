import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import type { StoreDto } from './stores.types'

interface StoreRow {
  id: string
  slug: string
  name: string
  abbr: string
  primary_color: string
  website_url: string | null
  logo_url: string | null
  product_count: string
}

@Injectable()
export class StoresRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async list(): Promise<StoreDto[]> {
    const result = await this.pool.query<StoreRow>(
      `select
        r.id::text,
        r.slug,
        r.name,
        r.abbr,
        r.primary_color,
        r.website_url,
        r.logo_url,
        count(distinct pv.product_id) as product_count
      from retailers r
      left join offers o on o.retailer_id = r.id
      left join product_variants pv on pv.id = o.product_variant_id
      group by r.id
      order by r.name asc`,
    )
    return result.rows.map(row => this.toDto(row))
  }

  async findBySlug(slug: string): Promise<StoreDto | null> {
    const result = await this.pool.query<StoreRow>(
      `select
        r.id::text,
        r.slug,
        r.name,
        r.abbr,
        r.primary_color,
        r.website_url,
        r.logo_url,
        count(distinct pv.product_id) as product_count
      from retailers r
      left join offers o on o.retailer_id = r.id
      left join product_variants pv on pv.id = o.product_variant_id
      where r.slug = $1
      group by r.id
      limit 1`,
      [slug],
    )
    return result.rows[0] ? this.toDto(result.rows[0]) : null
  }

  async productIdsByRetailerSlug(slug: string): Promise<string[]> {
    const result = await this.pool.query<{ id: string }>(
      `select distinct p.id::text
      from products p
      join product_variants pv on pv.product_id = p.id
      join offers o on o.product_variant_id = pv.id
      join retailers r on r.id = o.retailer_id
      where r.slug = $1
      order by p.id::text
      limit 100`,
      [slug],
    )
    return result.rows.map(row => row.id)
  }

  private toDto(row: StoreRow): StoreDto {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      abbr: row.abbr,
      color: row.primary_color,
      websiteUrl: row.website_url,
      logoUrl: row.logo_url,
      productCount: Number(row.product_count),
    }
  }
}
