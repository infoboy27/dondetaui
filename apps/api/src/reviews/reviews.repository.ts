import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import { AUTHOR_KEY_SQL } from './review-moderation'

export interface ReviewRow {
  id: string
  user_name: string | null
  author_key?: string
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
      `select pr.id::text, u.name as user_name, ${AUTHOR_KEY_SQL} as author_key, pr.rating, pr.comment, pr.created_at
      from product_reviews pr
      join users u on u.id = pr.user_id
      where pr.product_id = $1 and pr.hidden_at is null
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
      where product_id = $1 and hidden_at is null`,
      [productId],
    )
    return result.rows[0]
  }

  async aggregateMany(productIds: string[]): Promise<Map<string, ReviewAggregateRow>> {
    if (productIds.length === 0) return new Map()

    const result = await this.pool.query<ReviewAggregateRow & { product_id: string }>(
      `select product_id::text, avg(rating) as average, count(*) as count
      from product_reviews
      where product_id = any($1::uuid[]) and hidden_at is null
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
      returning id::text, rating, comment, created_at,
        left(encode(sha256(('dondeta-author:' || user_id::text)::bytea), 'hex'), 16) as author_key`,
      [productId, userId, rating, comment],
    )

    return { ...result.rows[0], user_name: null }
  }

  // --- Moderation (migration 033) -------------------------------------------

  async isBanned(userId: string): Promise<boolean> {
    const result = await this.pool.query<{ banned: boolean }>(
      'select reviews_banned_at is not null as banned from users where id = $1',
      [userId],
    )
    return result.rows[0]?.banned ?? false
  }

  // One report per user per review. Returns null if the review doesn't exist.
  async report(reviewId: string, reporterId: string, reason: string): Promise<{
    inserted: boolean
    reports: number
    productName: string
    comment: string | null
    hidden: boolean
  } | null> {
    const review = await this.pool.query<{ product_name: string; comment: string | null; hidden: boolean }>(
      `select p.name as product_name, pr.comment, pr.hidden_at is not null as hidden
      from product_reviews pr join products p on p.id = pr.product_id
      where pr.id = $1`,
      [reviewId],
    )
    const row = review.rows[0]
    if (!row) return null
    const inserted = await this.pool.query(
      `insert into review_reports (review_id, reporter_id, reason) values ($1, $2, $3)
      on conflict (review_id, reporter_id) do nothing`,
      [reviewId, reporterId, reason],
    )
    const count = await this.pool.query<{ n: string }>('select count(*) as n from review_reports where review_id = $1', [reviewId])
    return {
      inserted: (inserted.rowCount ?? 0) > 0,
      reports: Number(count.rows[0]?.n ?? 0),
      productName: row.product_name,
      comment: row.comment,
      hidden: row.hidden,
    }
  }

  async hide(reviewId: string, reason: string): Promise<boolean> {
    const result = await this.pool.query(
      'update product_reviews set hidden_at = coalesce(hidden_at, now()), hidden_reason = $2 where id = $1',
      [reviewId, reason],
    )
    return (result.rowCount ?? 0) > 0
  }

  async unhide(reviewId: string): Promise<boolean> {
    const result = await this.pool.query('update product_reviews set hidden_at = null, hidden_reason = null where id = $1', [reviewId])
    // Cleared reports: the owner decided, so the same three can't re-hide it.
    await this.pool.query('delete from review_reports where review_id = $1', [reviewId])
    return (result.rowCount ?? 0) > 0
  }

  async remove(reviewId: string): Promise<boolean> {
    const result = await this.pool.query('delete from product_reviews where id = $1', [reviewId])
    return (result.rowCount ?? 0) > 0
  }

  async setBan(reviewId: string, banned: boolean): Promise<boolean> {
    const result = await this.pool.query(
      `update users set reviews_banned_at = ${banned ? 'coalesce(reviews_banned_at, now())' : 'null'}
      where id = (select user_id from product_reviews where id = $1)`,
      [reviewId],
    )
    return (result.rowCount ?? 0) > 0
  }

  // Reported or hidden reviews, newest activity first, for /admin.
  async moderationQueue(limit = 100): Promise<Array<{
    id: string
    product_name: string
    product_slug: string | null
    rating: number
    comment: string | null
    author_name: string | null
    author_email: string
    author_banned: boolean
    reports: string
    reasons: string[] | null
    hidden_at: Date | null
    hidden_reason: string | null
    created_at: Date
    last_report_at: Date | null
  }>> {
    const result = await this.pool.query(
      `select pr.id::text, p.name as product_name, p.slug as product_slug, pr.rating, pr.comment,
        u.name as author_name, u.email as author_email, u.reviews_banned_at is not null as author_banned,
        count(rr.id) as reports, array_remove(array_agg(distinct rr.reason), null) as reasons,
        pr.hidden_at, pr.hidden_reason, pr.created_at, max(rr.created_at) as last_report_at
      from product_reviews pr
      join products p on p.id = pr.product_id
      join users u on u.id = pr.user_id
      left join review_reports rr on rr.review_id = pr.id
      group by pr.id, p.name, p.slug, u.name, u.email, u.reviews_banned_at
      having count(rr.id) > 0 or pr.hidden_at is not null
      order by coalesce(max(rr.created_at), pr.hidden_at) desc nulls last
      limit $1`,
      [limit],
    )
    return result.rows
  }

  // "Ocultar reseñas de este usuario" for signed-in readers.
  async blockedAuthors(blockerId: string): Promise<string[]> {
    const result = await this.pool.query<{ author_key: string }>(
      'select author_key from review_author_blocks where blocker_id = $1 order by created_at',
      [blockerId],
    )
    return result.rows.map(row => row.author_key)
  }

  async blockAuthor(blockerId: string, authorKey: string): Promise<void> {
    await this.pool.query(
      `insert into review_author_blocks (blocker_id, author_key) values ($1, $2)
      on conflict do nothing`,
      [blockerId, authorKey],
    )
  }

  async unblockAuthor(blockerId: string, authorKey: string): Promise<void> {
    await this.pool.query('delete from review_author_blocks where blocker_id = $1 and author_key = $2', [blockerId, authorKey])
  }
}
