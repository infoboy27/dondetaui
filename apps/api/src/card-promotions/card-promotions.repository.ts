import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import type { CardPromotionInput } from './card-promotion-input'

export interface CardPromotionDto {
  id: string
  retailerId: string
  retailerSlug: string
  store: string
  bank: string
  card: string | null
  percent: number
  maxDiscount: number | null
  minPurchase: number
  weekdays: number[] | null
  startsOn: string
  endsOn: string
  termsUrl: string | null
  note: string | null
}

interface Row {
  id: string
  retailer_id: string
  retailer_slug: string
  retailer_name: string
  bank: string
  card: string | null
  percent: string
  max_discount: string | null
  min_purchase: string
  weekdays: number[] | null
  starts_on: string
  ends_on: string
  terms_url: string | null
  note: string | null
}

const SELECT = `select
    p.id::text,
    r.id::text as retailer_id,
    r.slug as retailer_slug,
    r.name as retailer_name,
    p.bank,
    p.card,
    p.percent,
    p.max_discount,
    p.min_purchase,
    p.weekdays,
    to_char(p.starts_on, 'YYYY-MM-DD') as starts_on,
    to_char(p.ends_on, 'YYYY-MM-DD') as ends_on,
    p.terms_url,
    p.note
  from card_promotions p
  join retailers r on r.id = p.retailer_id`

@Injectable()
export class CardPromotionsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  // Running today (Dominican date), whatever the weekday: clients decide
  // whether a weekday-only promotion applies right now.
  async active(today: string): Promise<CardPromotionDto[]> {
    const result = await this.pool.query<Row>(
      `${SELECT} where p.starts_on <= $1::date and p.ends_on >= $1::date order by r.name, p.percent desc`,
      [today],
    )
    return result.rows.map(toDto)
  }

  // Current and upcoming, for the admin portal.
  async notExpired(today: string): Promise<CardPromotionDto[]> {
    const result = await this.pool.query<Row>(
      `${SELECT} where p.ends_on >= $1::date order by p.starts_on, r.name`,
      [today],
    )
    return result.rows.map(toDto)
  }

  async create(input: CardPromotionInput): Promise<CardPromotionDto | null> {
    const inserted = await this.pool.query<{ id: string }>(
      `insert into card_promotions
        (retailer_id, bank, card, percent, max_discount, min_purchase, weekdays, starts_on, ends_on, terms_url, note)
      select r.id, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 from retailers r where r.slug = $1
      returning id::text`,
      [input.retailerSlug, input.bank, input.card, input.percent, input.maxDiscount, input.minPurchase,
        input.weekdays, input.startsOn, input.endsOn, input.termsUrl, input.note],
    )
    const id = inserted.rows[0]?.id
    if (!id) return null
    const result = await this.pool.query<Row>(`${SELECT} where p.id = $1`, [id])
    return result.rows[0] ? toDto(result.rows[0]) : null
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.pool.query('delete from card_promotions where id = $1', [id])
    return (result.rowCount ?? 0) > 0
  }

  async deleteExpired(today: string): Promise<number> {
    const result = await this.pool.query('delete from card_promotions where ends_on < $1::date', [today])
    return result.rowCount ?? 0
  }
}

function toDto(row: Row): CardPromotionDto {
  return {
    id: row.id,
    retailerId: row.retailer_id,
    retailerSlug: row.retailer_slug,
    store: row.retailer_name,
    bank: row.bank,
    card: row.card,
    percent: Number(row.percent),
    maxDiscount: row.max_discount === null ? null : Number(row.max_discount),
    minPurchase: Number(row.min_purchase),
    weekdays: row.weekdays,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    termsUrl: row.terms_url,
    note: row.note,
  }
}
