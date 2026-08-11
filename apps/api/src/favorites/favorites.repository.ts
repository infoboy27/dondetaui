import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'

export interface FavoriteRow {
  product_id: string
  created_at: Date
}

@Injectable()
export class FavoritesRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(userId: string, productId: string): Promise<FavoriteRow> {
    const result = await this.pool.query<FavoriteRow>(
      `insert into favorites (user_id, product_id)
      values ($1, $2)
      on conflict (user_id, product_id) do update set user_id = excluded.user_id
      returning product_id::text, created_at`,
      [userId, productId],
    )
    return result.rows[0]
  }

  async findByUser(userId: string): Promise<FavoriteRow[]> {
    const result = await this.pool.query<FavoriteRow>(
      `select product_id::text, created_at
      from favorites
      where user_id = $1
      order by created_at desc`,
      [userId],
    )
    return result.rows
  }

  async remove(userId: string, productId: string): Promise<void> {
    await this.pool.query('delete from favorites where user_id = $1 and product_id = $2', [userId, productId])
  }
}
