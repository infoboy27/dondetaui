import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import type { StoreBranchDto, StoreDto } from './stores.types'

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

interface StoreBranchRow {
  id: string
  name: string
  address: string | null
  latitude: string | null
  longitude: string | null
  retailer_slug: string
  retailer_name: string
  abbr: string
  primary_color: string
  distance_km: string | null
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

  async branchesByRetailerSlug(slug: string): Promise<StoreBranchDto[]> {
    const result = await this.pool.query<StoreBranchRow>(
      `select
        s.id::text,
        s.name,
        s.address,
        s.latitude::text,
        s.longitude::text,
        r.slug as retailer_slug,
        r.name as retailer_name,
        r.abbr,
        r.primary_color,
        null as distance_km
      from stores s
      join retailers r on r.id = s.retailer_id
      where r.slug = $1
      order by s.name asc`,
      [slug],
    )
    return result.rows.map(row => this.toBranchDto(row))
  }

  // Haversine distance in km, computed in SQL so only nearby/ordered rows
  // ever cross the wire -- branches without coordinates are excluded rather
  // than sorted arbitrarily.
  async nearby(latitude: number, longitude: number, radiusKm: number): Promise<StoreBranchDto[]> {
    const result = await this.pool.query<StoreBranchRow>(
      `select * from (
        select
          s.id::text,
          s.name,
          s.address,
          s.latitude::text,
          s.longitude::text,
          r.slug as retailer_slug,
          r.name as retailer_name,
          r.abbr,
          r.primary_color,
          (
            6371 * acos(
              least(1, greatest(-1,
                cos(radians($1)) * cos(radians(s.latitude)) * cos(radians(s.longitude) - radians($2))
                + sin(radians($1)) * sin(radians(s.latitude))
              ))
            )
          )::text as distance_km
        from stores s
        join retailers r on r.id = s.retailer_id
        where s.latitude is not null and s.longitude is not null
      ) branches
      where distance_km::numeric <= $3
      order by distance_km::numeric asc
      limit 50`,
      [latitude, longitude, radiusKm],
    )
    return result.rows.map(row => this.toBranchDto(row))
  }

  private toBranchDto(row: StoreBranchRow): StoreBranchDto {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: row.latitude !== null ? Number(row.latitude) : null,
      longitude: row.longitude !== null ? Number(row.longitude) : null,
      retailer: {
        slug: row.retailer_slug,
        name: row.retailer_name,
        abbr: row.abbr,
        color: row.primary_color,
      },
      ...(row.distance_km !== null ? { distanceKm: Math.round(Number(row.distance_km) * 10) / 10 } : {}),
    }
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
