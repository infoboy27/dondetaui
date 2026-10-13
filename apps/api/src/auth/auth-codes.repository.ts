import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import { CODE_MAX_ATTEMPTS, CODE_RESEND_COOLDOWN_MS, CODE_TTL_MS, type CodePurpose, codeMatches, generateCode, hashCode } from './codes'

function secret(): string {
  const value = process.env.JWT_SECRET
  if (!value) throw new Error('JWT_SECRET is required')
  return value
}

@Injectable()
export class AuthCodesRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  // Creates a fresh code (voiding any earlier one for the same purpose) and
  // returns it in clear so it can be emailed. Refuses if one was sent less
  // than a minute ago, so the endpoint can't be used to spam an inbox.
  async issue(userId: string, purpose: CodePurpose): Promise<string> {
    const recent = await this.pool.query<{ created_at: Date }>(
      `select created_at from auth_codes
      where user_id = $1 and purpose = $2
      order by created_at desc
      limit 1`,
      [userId, purpose],
    )
    const last = recent.rows[0]?.created_at
    if (last && Date.now() - last.getTime() < CODE_RESEND_COOLDOWN_MS) {
      // Object body so clients get it as `message`, like every other error.
      throw new HttpException(
        { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: 'Espera un minuto antes de pedir otro código.' },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    const code = generateCode()
    await this.pool.query(
      `update auth_codes set consumed_at = now()
      where user_id = $1 and purpose = $2 and consumed_at is null`,
      [userId, purpose],
    )
    await this.pool.query(
      `insert into auth_codes (user_id, purpose, code_hash, expires_at)
      values ($1, $2, $3, now() + ($4 || ' milliseconds')::interval)`,
      [userId, purpose, hashCode(code, userId, purpose, secret()), String(CODE_TTL_MS)],
    )
    return code
  }

  // True (and the code is spent) when it matches the live code for this
  // purpose. Every wrong try counts; after the limit the code is dead.
  async consume(userId: string, purpose: CodePurpose, code: string): Promise<boolean> {
    const result = await this.pool.query<{ id: string; code_hash: string; attempts: number }>(
      `select id::text, code_hash, attempts from auth_codes
      where user_id = $1 and purpose = $2 and consumed_at is null and expires_at > now()
      order by created_at desc
      limit 1`,
      [userId, purpose],
    )
    const row = result.rows[0]
    if (!row || row.attempts >= CODE_MAX_ATTEMPTS) return false

    if (!codeMatches(code, row.code_hash, userId, purpose, secret())) {
      await this.pool.query('update auth_codes set attempts = attempts + 1 where id = $1', [row.id])
      return false
    }
    await this.pool.query('update auth_codes set consumed_at = now() where id = $1', [row.id])
    return true
  }
}
