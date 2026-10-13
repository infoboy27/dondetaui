import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Pool } from 'pg'
import { DATABASE_POOL } from '../database/database.module'

interface AuthorizedRequest {
  headers: { authorization?: string }
  userId?: string
}

export interface AuthenticatedRequest {
  userId: string
}

// A valid signature isn't enough: the account must still exist (it may have
// been deleted) and the token must be newer than the last "sign out of every
// device" or password change. Second-step challenge tokens never pass.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthorizedRequest>()
    const header = request.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

    if (!token) throw new UnauthorizedException('Inicia sesión para continuar.')

    let payload: { sub: string; iat?: number; purpose?: string }
    try {
      payload = await this.jwt.verifyAsync(token)
    } catch {
      throw new UnauthorizedException('Tu sesión venció. Inicia sesión de nuevo.')
    }
    if (payload.purpose) throw new UnauthorizedException('Inicia sesión para continuar.')

    const result = await this.pool.query<{ sessions_valid_after: Date | null }>(
      'select sessions_valid_after from users where id = $1',
      [payload.sub],
    )
    const user = result.rows[0]
    if (!user) throw new UnauthorizedException('Tu sesión venció. Inicia sesión de nuevo.')
    const validAfter = user.sessions_valid_after?.getTime()
    if (validAfter && (payload.iat ?? 0) * 1000 < validAfter) {
      throw new UnauthorizedException('Tu sesión se cerró. Inicia sesión de nuevo.')
    }

    request.userId = payload.sub
    return true
  }
}
