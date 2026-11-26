import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import { resolvePrefs, type NotificationPrefs } from './notification-prefs'

@Injectable()
export class NotificationPrefsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async get(userId: string): Promise<NotificationPrefs> {
    const result = await this.pool.query<{ prefs: unknown }>('select prefs from notification_preferences where user_id = $1', [userId])
    return resolvePrefs(result.rows[0]?.prefs ?? null)
  }

  /** Merges the patch into the stored choices (jsonb ||) and returns the full, resolved set. */
  async update(userId: string, patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    const result = await this.pool.query<{ prefs: unknown }>(
      `insert into notification_preferences (user_id, prefs)
      values ($1, $2::jsonb)
      on conflict (user_id) do update set
        prefs = notification_preferences.prefs || excluded.prefs,
        updated_at = now()
      returning prefs`,
      [userId, JSON.stringify(patch)],
    )
    return resolvePrefs(result.rows[0]?.prefs ?? null)
  }
}
