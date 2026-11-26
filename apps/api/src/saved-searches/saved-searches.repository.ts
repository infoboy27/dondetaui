import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import type { SavedSearchInput } from './saved-search-input'

export interface SavedSearchDto {
  id: string
  query: string
  maxPrice: number | null
  createdAt: string
}

interface Row {
  id: string
  query: string
  max_price: string | null
  created_at: Date
}

function toDto(row: Row): SavedSearchDto {
  return { id: row.id, query: row.query, maxPrice: row.max_price === null ? null : Number(row.max_price), createdAt: row.created_at.toISOString() }
}

@Injectable()
export class SavedSearchesRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async list(userId: string): Promise<SavedSearchDto[]> {
    const result = await this.pool.query<Row>(
      'select id::text, query, max_price, created_at from saved_searches where user_id = $1 order by created_at desc',
      [userId],
    )
    return result.rows.map(toDto)
  }

  async count(userId: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>('select count(*)::text as count from saved_searches where user_id = $1', [userId])
    return Number(result.rows[0]?.count ?? 0)
  }

  async exists(userId: string, query: string): Promise<boolean> {
    const result = await this.pool.query('select 1 from saved_searches where user_id = $1 and query = $2', [userId, query])
    return (result.rowCount ?? 0) > 0
  }

  /** Saving the same search again only updates its max price (and keeps its creation date). */
  async save(userId: string, input: SavedSearchInput): Promise<SavedSearchDto> {
    const result = await this.pool.query<Row>(
      `insert into saved_searches (user_id, query, max_price)
      values ($1, $2, $3)
      on conflict (user_id, query) do update set max_price = excluded.max_price
      returning id::text, query, max_price, created_at`,
      [userId, input.query, input.maxPrice],
    )
    return toDto(result.rows[0]!)
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.pool.query('delete from saved_searches where user_id = $1 and id = $2', [userId, id])
  }
}
