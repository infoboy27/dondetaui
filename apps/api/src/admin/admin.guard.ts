import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'

// The admin portal is for DóndeTa's owner only: a regular logged-in user
// whose email is listed in ADMIN_EMAILS (comma-separated, case-insensitive),
// who has also passed the TOTP second step (see admin-mfa.controller.ts).
export function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

export interface AdminTokenPayload {
  sub: string
  mfa?: boolean
  iat?: number
}

export interface AdminUserRow {
  id: string
  email: string
  totp_secret_enc: string | null
  totp_pending_enc: string | null
  totp_enabled_at: Date | null
  admin_sessions_valid_after: Date | null
}

export interface AdminRequest {
  headers: { authorization?: string }
  admin?: { user: AdminUserRow; payload: AdminTokenPayload }
}

// The 403 bodies carry a code the portal switches on ({ message: code }).
const deny = (code: string) => new ForbiddenException({ statusCode: 403, message: code })

// Logged in with an admin email -- password only, no second step yet. Enough
// for the TOTP setup/verify endpoints, nothing else.
@Injectable()
export class AdminIdentityGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>()
    const header = request.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
    if (!token) throw new UnauthorizedException('Missing token')

    let payload: AdminTokenPayload
    try {
      payload = await this.jwt.verifyAsync<AdminTokenPayload>(token)
    } catch {
      throw new UnauthorizedException('Invalid token')
    }

    const result = await this.pool.query<AdminUserRow>(
      `select id::text, email, totp_secret_enc, totp_pending_enc, totp_enabled_at, admin_sessions_valid_after
       from users where id = $1`,
      [payload.sub],
    )
    const user = result.rows[0]
    if (!user || !adminEmails().has(user.email.toLowerCase())) throw deny('not_admin')
    request.admin = { user, payload }
    return true
  }
}

// Full portal access: admin identity + a token minted by the TOTP step
// (mfa: true, 12 h) that wasn't revoked by "cerrar todas las sesiones".
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly identity: AdminIdentityGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.identity.canActivate(context)
    const { user, payload } = context.switchToHttp().getRequest<AdminRequest>().admin!
    if (!payload.mfa) throw deny(user.totp_enabled_at ? 'mfa_required' : 'mfa_setup_required')
    const validAfter = user.admin_sessions_valid_after
    if (validAfter && (payload.iat ?? 0) < Math.floor(validAfter.getTime() / 1000)) {
      throw deny(user.totp_enabled_at ? 'mfa_required' : 'mfa_setup_required')
    }
    return true
  }
}
