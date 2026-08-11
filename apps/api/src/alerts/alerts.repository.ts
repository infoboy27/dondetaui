import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'

export interface AlertRow {
  product_id: string
  target_price: string | number | null
  last_notified_price: string | number | null
  created_at: Date
}

export interface AlertWorkerRow {
  alert_id: string
  user_email: string
  user_phone: string | null
  push_tokens: string[]
  product_id: string
  target_price: string | number | null
  last_notified_price: string | number | null
}

@Injectable()
export class AlertsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(userId: string, productId: string, targetPrice: number | null): Promise<AlertRow> {
    const result = await this.pool.query<AlertRow>(
      `insert into price_alerts (user_id, product_id, target_price)
      values ($1, $2, $3)
      on conflict (user_id, product_id) do update set target_price = excluded.target_price
      returning product_id::text, target_price, last_notified_price, created_at`,
      [userId, productId, targetPrice],
    )
    return result.rows[0]
  }

  async findByUser(userId: string): Promise<AlertRow[]> {
    const result = await this.pool.query<AlertRow>(
      `select product_id::text, target_price, last_notified_price, created_at
      from price_alerts
      where user_id = $1
      order by created_at desc`,
      [userId],
    )
    return result.rows
  }

  async remove(userId: string, productId: string): Promise<void> {
    await this.pool.query('delete from price_alerts where user_id = $1 and product_id = $2', [userId, productId])
  }

  /** For the standalone worker: every alert joined to its owner's contact info. */
  async findAllForWorker(): Promise<AlertWorkerRow[]> {
    const result = await this.pool.query<AlertWorkerRow>(
      `select
        pa.id::text as alert_id,
        u.email as user_email,
        u.phone as user_phone,
        coalesce(pt.tokens, array[]::text[]) as push_tokens,
        pa.product_id::text as product_id,
        pa.target_price,
        pa.last_notified_price
      from price_alerts pa
      join users u on u.id = pa.user_id
      left join (
        select user_id, array_agg(token) as tokens
        from push_tokens
        group by user_id
      ) pt on pt.user_id = u.id`,
    )
    return result.rows
  }

  async markNotified(alertId: string, price: number): Promise<void> {
    await this.pool.query('update price_alerts set last_notified_price = $2 where id = $1', [alertId, price])
  }
}
