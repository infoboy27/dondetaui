import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

interface AuthorizedRequest {
  headers: { authorization?: string }
  userId?: string
}

export interface AuthenticatedRequest {
  userId: string
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthorizedRequest>()
    const header = request.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

    if (!token) throw new UnauthorizedException('Missing token')

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token)
      request.userId = payload.sub
      return true
    } catch {
      throw new UnauthorizedException('Invalid token')
    }
  }
}
