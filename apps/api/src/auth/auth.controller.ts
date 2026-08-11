import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto } from './auth.types'
import { JwtAuthGuard, type AuthenticatedRequest } from './jwt-auth.guard'

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
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return this.auth.me(req.userId)
  }
}
