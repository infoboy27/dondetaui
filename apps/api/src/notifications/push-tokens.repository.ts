import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'

@Injectable()
export class PushTokensRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async register(userId: string, token: string, platform: string): Promise<void> {
    await this.pool.query(
      `insert into push_tokens (user_id, token, platform)
      values ($1, $2, $3)
      on conflict (token) do update set user_id = excluded.user_id, platform = excluded.platform`,
      [userId, token, platform],
    )
  }

  async unregister(userId: string, token: string): Promise<void> {
    await this.pool.query('delete from push_tokens where user_id = $1 and token = $2', [userId, token])
  }
}
