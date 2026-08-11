import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'

export interface ReviewRow {
  id: string
  user_name: string | null
  rating: number
  comment: string | null
  created_at: Date
}

export interface ReviewAggregateRow {
  average: string | number | null
  count: string | number
}

@Injectable()
export class ReviewsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findByProduct(productId: string, limit = 20): Promise<ReviewRow[]> {
    const result = await this.pool.query<ReviewRow>(
      `select pr.id::text, u.name as user_name, pr.rating, pr.comment, pr.created_at
      from product_reviews pr
      join users u on u.id = pr.user_id
      where pr.product_id = $1
      order by pr.created_at desc
      limit $2`,
      [productId, limit],
    )
    return result.rows
  }

  async aggregate(productId: string): Promise<ReviewAggregateRow> {
    const result = await this.pool.query<ReviewAggregateRow>(
      `select avg(rating) as average, count(*) as count
      from product_reviews
      where product_id = $1`,
      [productId],
    )
    return result.rows[0]
  }

  async aggregateMany(productIds: string[]): Promise<Map<string, ReviewAggregateRow>> {
    if (productIds.length === 0) return new Map()

    const result = await this.pool.query<ReviewAggregateRow & { product_id: string }>(
      `select product_id::text, avg(rating) as average, count(*) as count
      from product_reviews
      where product_id = any($1::uuid[])
      group by product_id`,
      [productIds],
    )
    return new Map(result.rows.map(row => [row.product_id, row]))
  }

  async upsert(userId: string, productId: string, rating: number, comment: string | null): Promise<ReviewRow> {
    const result = await this.pool.query<ReviewRow>(
      `insert into product_reviews (product_id, user_id, rating, comment)
      values ($1, $2, $3, $4)
      on conflict (product_id, user_id) do update
        set rating = excluded.rating, comment = excluded.comment, updated_at = now()
      returning id::text, rating, comment, created_at`,
      [productId, userId, rating, comment],
    )

    return { ...result.rows[0], user_name: null }
  }
}
