import { Body, ConflictException, Controller, Inject, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Throttle } from '@nestjs/throttler'
import type { Pool } from 'pg'
import { sendDiscordAlert } from '../common/discord-webhook'
import { DATABASE_POOL } from '../database/database.module'
import { AdminGuard, AdminIdentityGuard, type AdminRequest } from './admin.guard'
import { decryptSecret, encryptSecret, generateSecret, otpauthUrl, verifyTotp } from './totp'

// Admin sessions are short on purpose: 12 h, then the TOTP code again.
const ADMIN_SESSION = '12h'
// Code guessing is the attack here: 5 tries a minute per IP.
const MFA_THROTTLE = { default: { ttl: 60_000, limit: 5 } }

@Controller('admin/mfa')
export class AdminMfaController {
  constructor(
    private readonly jwt: JwtService,
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  // First time only: a new secret to scan. Not active until /enable confirms
  // a code from it, so a half-finished setup never locks the owner out.
  @Post('setup')
  @UseGuards(AdminIdentityGuard)
  async setup(@Req() req: AdminRequest) {
    const { user } = req.admin!
    if (user.totp_enabled_at) throw new ConflictException('2FA ya está activado')
    const secret = generateSecret()
    await this.pool.query('update users set totp_pending_enc = $2 where id = $1', [user.id, encryptSecret(secret)])
    return { secret, otpauthUrl: otpauthUrl(user.email, secret) }
  }

  @Post('enable')
  @Throttle(MFA_THROTTLE)
  @UseGuards(AdminIdentityGuard)
  async enable(@Req() req: AdminRequest, @Body() body: { code?: string }) {
    const { user } = req.admin!
    if (user.totp_enabled_at) throw new ConflictException('2FA ya está activado')
    if (!user.totp_pending_enc) throw new UnauthorizedException('Primero genera el código QR')
    if (!verifyTotp(decryptSecret(user.totp_pending_enc), String(body.code ?? ''))) {
      throw new UnauthorizedException('Código incorrecto')
    }
    await this.pool.query(
      `update users set totp_secret_enc = totp_pending_enc, totp_pending_enc = null, totp_enabled_at = now() where id = $1`,
      [user.id],
    )
    sendDiscordAlert(process.env.DISCORD_WEBHOOK_ALERTS, `🔐 2FA activado para el portal admin (${user.email})`)
    return { token: this.adminToken(user.id) }
  }

  @Post('verify')
  @Throttle(MFA_THROTTLE)
  @UseGuards(AdminIdentityGuard)
  async verify(@Req() req: AdminRequest, @Body() body: { code?: string }) {
    const { user } = req.admin!
    if (!user.totp_secret_enc) throw new UnauthorizedException('2FA no está configurado')
    if (!verifyTotp(decryptSecret(user.totp_secret_enc), String(body.code ?? ''))) {
      sendDiscordAlert(process.env.DISCORD_WEBHOOK_ALERTS, `⚠️ Código 2FA incorrecto en el portal admin (${user.email})`)
      throw new UnauthorizedException('Código incorrecto')
    }
    return { token: this.adminToken(user.id) }
  }

  // Revokes every admin session (other browsers, a lost laptop) and hands
  // this one a fresh token so it stays signed in.
  @Post('logout-all')
  @UseGuards(AdminGuard)
  async logoutAll(@Req() req: AdminRequest) {
    const { user } = req.admin!
    await this.pool.query(`update users set admin_sessions_valid_after = date_trunc('second', now()) where id = $1`, [user.id])
    sendDiscordAlert(process.env.DISCORD_WEBHOOK_ALERTS, `🔒 Se cerraron todas las sesiones admin (${user.email})`)
    return { token: this.adminToken(user.id) }
  }

  private adminToken(userId: string): string {
    return this.jwt.sign({ sub: userId, mfa: true }, { expiresIn: ADMIN_SESSION })
  }
}
