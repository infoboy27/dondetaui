import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersRepository } from '../auth/users.repository'

// The admin portal is for DóndeTa's owner only: a regular logged-in user
// whose email is listed in ADMIN_EMAILS (comma-separated, case-insensitive).
// No role column -- one env var per stack is the whole permission model.
export function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    private readonly users: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.jwtGuard.canActivate(context)
    const request = context.switchToHttp().getRequest<{ userId?: string }>()
    const user = request.userId ? await this.users.findById(request.userId) : null
    if (!user || !adminEmails().has(user.email.toLowerCase())) {
      throw new ForbiddenException('Admin access only')
    }
    return true
  }
}
