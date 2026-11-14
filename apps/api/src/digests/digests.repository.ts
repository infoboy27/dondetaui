import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import { newUnsubscribeToken, type DigestTopic } from './digest-schedule'

export interface DigestRecipient {
  subscription_id: string
  email: string
  name: string | null
  unsubscribe_token: string
}

@Injectable()
export class DigestsRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async isSubscribed(userId: string, topic: DigestTopic): Promise<boolean> {
    const result = await this.pool.query('select 1 from digest_subscriptions where user_id = $1 and topic = $2', [userId, topic])
    return (result.rowCount ?? 0) > 0
  }

  async subscribe(userId: string, topic: DigestTopic): Promise<void> {
    await this.pool.query(
      `insert into digest_subscriptions (user_id, topic, unsubscribe_token)
      values ($1, $2, $3)
      on conflict (user_id, topic) do nothing`,
      [userId, topic, newUnsubscribeToken()],
    )
  }

  async unsubscribe(userId: string, topic: DigestTopic): Promise<void> {
    await this.pool.query('delete from digest_subscriptions where user_id = $1 and topic = $2', [userId, topic])
  }

  /** One-click unsubscribe from the email link; true when a row was removed. */
  async unsubscribeByToken(token: string): Promise<boolean> {
    const result = await this.pool.query('delete from digest_subscriptions where unsubscribe_token = $1', [token])
    return (result.rowCount ?? 0) > 0
  }

  /** Subscribers who haven't received today's digest yet. */
  async pending(topic: DigestTopic, day: string): Promise<DigestRecipient[]> {
    const result = await this.pool.query<DigestRecipient>(
      `select ds.id::text as subscription_id, u.email, u.name, ds.unsubscribe_token
      from digest_subscriptions ds
      join users u on u.id = ds.user_id
      where ds.topic = $1 and (ds.last_sent_on is null or ds.last_sent_on < $2::date)
      order by ds.created_at`,
      [topic, day],
    )
    return result.rows
  }

  async markSent(subscriptionId: string, day: string): Promise<void> {
    await this.pool.query('update digest_subscriptions set last_sent_on = $2::date where id = $1', [subscriptionId, day])
  }
}
