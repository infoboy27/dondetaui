import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'

@Injectable()
export class PushTokensRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /** Upsert: the same device can move between accounts; registering again re-enables a disabled token. */
  async register(userId: string, token: string, platform: string): Promise<void> {
    await this.pool.query(
      `insert into push_tokens (user_id, token, platform)
      values ($1, $2, $3)
      on conflict (token) do update set
        user_id = excluded.user_id,
        platform = excluded.platform,
        last_seen_at = now(),
        disabled_at = null`,
      [userId, token, platform],
    )
  }

  async unregister(userId: string, token: string): Promise<void> {
    await this.pool.query('delete from push_tokens where user_id = $1 and token = $2', [userId, token])
  }

  async activeTokens(): Promise<string[]> {
    const result = await this.pool.query<{ token: string }>('select distinct token from push_tokens where disabled_at is null')
    return result.rows.map(row => row.token)
  }

  /** Active devices per platform, for the /admin broadcast screen. */
  async activeCounts(): Promise<{ ios: number; android: number; total: number }> {
    const result = await this.pool.query<{ platform: string; devices: string }>(
      'select platform, count(distinct token) as devices from push_tokens where disabled_at is null group by platform',
    )
    const counts = { ios: 0, android: 0, total: 0 }
    for (const row of result.rows) {
      const devices = Number(row.devices)
      if (row.platform === 'ios' || row.platform === 'android') counts[row.platform] += devices
      counts.total += devices
    }
    return counts
  }

  async disable(tokens: string[]): Promise<void> {
    if (!tokens.length) return
    await this.pool.query('update push_tokens set disabled_at = now() where token = any($1::text[]) and disabled_at is null', [tokens])
  }

  async savePendingTickets(tickets: { id: string; token: string }[]): Promise<void> {
    if (!tickets.length) return
    await this.pool.query(
      `insert into push_tickets (id, token)
      select * from unnest($1::text[], $2::text[])
      on conflict (id) do nothing`,
      [tickets.map(ticket => ticket.id), tickets.map(ticket => ticket.token)],
    )
  }

  /** Tickets old enough for Expo to have a receipt (it takes up to ~15 min). */
  async dueTickets(limit = 5000): Promise<{ id: string; token: string }[]> {
    const result = await this.pool.query<{ id: string; token: string }>(
      `select id, token from push_tickets
      where created_at < now() - interval '15 minutes'
      order by created_at
      limit $1`,
      [limit],
    )
    return result.rows
  }

  /** Drops checked tickets, plus any older than a day (Expo keeps receipts ~24 h). */
  async deleteTickets(ids: string[]): Promise<void> {
    await this.pool.query(
      `delete from push_tickets where id = any($1::text[]) or created_at < now() - interval '24 hours'`,
      [ids],
    )
  }
}
