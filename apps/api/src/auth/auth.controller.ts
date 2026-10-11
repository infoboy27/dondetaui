import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto } from './auth.types'
import { JwtAuthGuard, type AuthenticatedRequest } from './jwt-auth.guard'
import { adminEmails } from '../admin/admin.guard'
import { sendDiscordAlert } from '../common/discord-webhook'

// Tighter than the app-wide default: these endpoints are the brute-force
// surface (password guessing, account enumeration via registration).
const AUTH_THROTTLE = { default: { ttl: 60_000, limit: 10 } }

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle(AUTH_THROTTLE)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Throttle(AUTH_THROTTLE)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
    // Every sign-in attempt on an admin account -- successful or not -- is
    // posted to Discord, so an unexpected one is noticed right away.
    const isAdmin = adminEmails().has(dto.email.trim().toLowerCase())
    const where = `IP ${req.ip ?? '?'} · ${String(req.headers['user-agent'] ?? '').slice(0, 120)}`
    try {
      const result = await this.auth.login(dto)
      if (isAdmin) sendDiscordAlert(process.env.DISCORD_WEBHOOK_ALERTS, `🔐 Inicio de sesión en el portal admin (${dto.email}) desde ${where}`)
      return result
    } catch (error) {
      if (isAdmin) sendDiscordAlert(process.env.DISCORD_WEBHOOK_ALERTS, `⚠️ Intento fallido de inicio de sesión admin (${dto.email}) desde ${where}`)
      throw error
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return this.auth.me(req.userId)
  }
}
