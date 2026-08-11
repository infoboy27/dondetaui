import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'

@Injectable()
export class SearchHistoryRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async record(userId: string, query: string): Promise<void> {
    await this.pool.query('insert into search_history (user_id, query) values ($1, $2)', [userId, query])
  }

  // Collapses to the most recent distinct terms -- repeated searches for the
  // same thing shouldn't push older, different searches out of the list.
  async recentDistinct(userId: string, limit = 10): Promise<string[]> {
    const result = await this.pool.query<{ query: string }>(
      `select query
      from (
        select query, max(created_at) as last_searched_at
        from search_history
        where user_id = $1
        group by query
      ) recent
      order by last_searched_at desc
      limit $2`,
      [userId, limit],
    )
    return result.rows.map(row => row.query)
  }

  async clear(userId: string): Promise<void> {
    await this.pool.query('delete from search_history where user_id = $1', [userId])
  }
}
