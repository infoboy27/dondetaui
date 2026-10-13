import { Body, Controller, Delete, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import {
  ChangePasswordDto,
  CodeDto,
  EmailDto,
  LoginDto,
  MfaChallengeDto,
  MfaVerifyDto,
  PasswordDto,
  RegisterDto,
  ResetPasswordDto,
} from './auth.types'
import { JwtAuthGuard, type AuthenticatedRequest } from './jwt-auth.guard'
import { adminEmails } from '../admin/admin.guard'
import { sendDiscordAlert } from '../common/discord-webhook'

// Tighter than the app-wide default: these endpoints are the brute-force
// surface (password guessing, account enumeration via registration).
const AUTH_THROTTLE = { default: { ttl: 60_000, limit: 10 } }
// 6-digit codes: few tries per minute per IP, on top of the per-code limit.
const CODE_THROTTLE = { default: { ttl: 60_000, limit: 6 } }

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
  @HttpCode(200)
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

  // Second step of sign-in (only for accounts with 2FA on).
  @Throttle(CODE_THROTTLE)
  @Post('mfa/verify')
  @HttpCode(200)
  verifyMfa(@Body() dto: MfaVerifyDto) {
    return this.auth.verifyMfa(dto)
  }

  @Throttle(CODE_THROTTLE)
  @Post('mfa/email-code')
  @HttpCode(200)
  sendMfaEmail(@Body() dto: MfaChallengeDto) {
    return this.auth.sendMfaEmail(dto.challenge)
  }

  @Throttle(CODE_THROTTLE)
  @Post('password/forgot')
  @HttpCode(200)
  forgotPassword(@Body() dto: EmailDto) {
    return this.auth.forgotPassword(dto.email)
  }

  @Throttle(CODE_THROTTLE)
  @Post('password/reset')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return this.auth.me(req.userId)
  }

  @UseGuards(JwtAuthGuard)
  @Throttle(CODE_THROTTLE)
  @Post('email/send-code')
  @HttpCode(200)
  sendVerification(@Req() req: AuthenticatedRequest) {
    return this.auth.sendVerification(req.userId)
  }

  @UseGuards(JwtAuthGuard)
  @Throttle(CODE_THROTTLE)
  @Post('email/verify')
  @HttpCode(200)
  verifyEmail(@Req() req: AuthenticatedRequest, @Body() dto: CodeDto) {
    return this.auth.verifyEmail(req.userId, dto.code)
  }

  @UseGuards(JwtAuthGuard)
  @Throttle(AUTH_THROTTLE)
  @Post('password/change')
  @HttpCode(200)
  changePassword(@Req() req: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(req.userId, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Throttle(AUTH_THROTTLE)
  @Post('mfa/email/enable')
  @HttpCode(200)
  enableEmailMfa(@Req() req: AuthenticatedRequest, @Body() dto: PasswordDto) {
    return this.auth.enableEmailMfa(req.userId, dto.password)
  }

  @UseGuards(JwtAuthGuard)
  @Throttle(AUTH_THROTTLE)
  @Post('mfa/totp/setup')
  @HttpCode(200)
  setupTotp(@Req() req: AuthenticatedRequest, @Body() dto: PasswordDto) {
    return this.auth.setupTotp(req.userId, dto.password)
  }

  @UseGuards(JwtAuthGuard)
  @Throttle(CODE_THROTTLE)
  @Post('mfa/totp/enable')
  @HttpCode(200)
  enableTotp(@Req() req: AuthenticatedRequest, @Body() dto: CodeDto) {
    return this.auth.enableTotp(req.userId, dto.code)
  }

  @UseGuards(JwtAuthGuard)
  @Throttle(AUTH_THROTTLE)
  @Post('mfa/disable')
  @HttpCode(200)
  disableMfa(@Req() req: AuthenticatedRequest, @Body() dto: PasswordDto) {
    return this.auth.disableMfa(req.userId, dto.password)
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(200)
  logoutEverywhere(@Req() req: AuthenticatedRequest) {
    return this.auth.logoutEverywhere(req.userId)
  }

  // Required by the App Store and Google Play for apps with sign-up.
  @UseGuards(JwtAuthGuard)
  @Throttle(AUTH_THROTTLE)
  @Delete('me')
  deleteAccount(@Req() req: AuthenticatedRequest, @Body() dto: PasswordDto) {
    return this.auth.deleteAccount(req.userId, dto.password)
  }
}
