import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import type { MfaMethod, UserDto } from './auth.types'

export interface UserRow {
  id: string
  email: string
  password_hash: string
  name: string | null
  phone: string | null
  email_verified_at: Date | null
  mfa_method: MfaMethod | null
  totp_secret_enc: string | null
  totp_pending_enc: string | null
  sessions_valid_after: Date | null
}

const COLUMNS = `id::text, email, password_hash, name, phone, email_verified_at, mfa_method,
  totp_secret_enc, totp_pending_enc, sessions_valid_after`

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await this.pool.query<UserRow>(
      `select ${COLUMNS}
      from users
      where lower(email) = lower($1)
      limit 1`,
      [email],
    )
    return result.rows[0] ?? null
  }

  async findById(id: string): Promise<UserRow | null> {
    const result = await this.pool.query<UserRow>(
      `select ${COLUMNS}
      from users
      where id = $1
      limit 1`,
      [id],
    )
    return result.rows[0] ?? null
  }

  async create(email: string, passwordHash: string, name: string | null, phone: string | null): Promise<UserRow> {
    const result = await this.pool.query<UserRow>(
      `insert into users (email, password_hash, name, phone)
      values ($1, $2, $3, $4)
      returning ${COLUMNS}`,
      [email, passwordHash, name, phone],
    )
    return result.rows[0]
  }

  // New password; every token issued before now stops working.
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.pool.query(
      `update users set password_hash = $2, sessions_valid_after = date_trunc('second', now()) where id = $1`,
      [id, passwordHash],
    )
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.pool.query('update users set email_verified_at = coalesce(email_verified_at, now()) where id = $1', [id])
  }

  async setMfaMethod(id: string, method: MfaMethod | null): Promise<void> {
    await this.pool.query('update users set mfa_method = $2 where id = $1', [id, method])
  }

  async setTotpPending(id: string, secretEnc: string): Promise<void> {
    await this.pool.query('update users set totp_pending_enc = $2 where id = $1', [id, secretEnc])
  }

  // The scanned secret becomes the account's authenticator (shared with the
  // admin portal's 2FA, migration 015) and the sign-in method.
  async activateTotp(id: string): Promise<void> {
    await this.pool.query(
      `update users set totp_secret_enc = totp_pending_enc, totp_pending_enc = null,
        totp_enabled_at = now(), mfa_method = 'totp'
      where id = $1 and totp_pending_enc is not null`,
      [id],
    )
  }

  async clearTotp(id: string): Promise<void> {
    await this.pool.query(
      'update users set totp_secret_enc = null, totp_pending_enc = null, totp_enabled_at = null where id = $1',
      [id],
    )
  }

  async revokeSessions(id: string): Promise<void> {
    await this.pool.query(`update users set sessions_valid_after = date_trunc('second', now()) where id = $1`, [id])
  }

  // Favorites, alerts, reviews, search history, push tokens and codes go
  // with it (all reference users on delete cascade).
  async delete(id: string): Promise<void> {
    await this.pool.query('delete from users where id = $1', [id])
  }

  toDto(row: UserRow): UserDto {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      emailVerified: row.email_verified_at !== null,
      mfaMethod: row.mfa_method,
    }
  }
}
