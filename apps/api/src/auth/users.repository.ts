import { Inject, Injectable } from '@nestjs/common'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'
import type { UserDto } from './auth.types'

interface UserRow {
  id: string
  email: string
  password_hash: string
  name: string | null
  phone: string | null
}

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await this.pool.query<UserRow>(
      `select id::text, email, password_hash, name, phone
      from users
      where lower(email) = lower($1)
      limit 1`,
      [email],
    )
    return result.rows[0] ?? null
  }

  async findById(id: string): Promise<UserRow | null> {
    const result = await this.pool.query<UserRow>(
      `select id::text, email, password_hash, name, phone
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
      returning id::text, email, password_hash, name, phone`,
      [email, passwordHash, name, phone],
    )
    return result.rows[0]
  }

  toDto(row: UserRow): UserDto {
    return { id: row.id, email: row.email, name: row.name, phone: row.phone }
  }
}
