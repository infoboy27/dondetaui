import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcryptjs'
import { sendDiscordAlert } from '../common/discord-webhook'
import { EmailProvider } from '../notifications/email.provider'
import { adminEmails } from '../admin/admin.guard'
import { decryptSecret, encryptSecret, generateSecret, otpauthUrl, verifyTotp } from '../admin/totp'
import { AuthCodesRepository } from './auth-codes.repository'
import { maskEmail } from './codes'
import {
  accountDeletedEmail,
  loginCodeEmail,
  mfaChangedEmail,
  passwordChangedEmail,
  resetPasswordEmail,
  verifyEmailEmail,
  welcomeEmail,
  type EmailContent,
} from './account-emails'
import { UsersRepository, type UserRow } from './users.repository'
import type {
  AuthResultDto,
  ChangePasswordDto,
  LoginDto,
  LoginResultDto,
  MfaChallengeResultDto,
  MfaMethod,
  MfaVerifyDto,
  RegisterDto,
  ResetPasswordDto,
  UserDto,
} from './auth.types'

const SALT_ROUNDS = 10
// The pause between password and second step can't outlive a code.
const CHALLENGE_TTL = '10m'
const WRONG_CODE = 'Código incorrecto o vencido. Revisa o pide uno nuevo.'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly users: UsersRepository,
    private readonly codes: AuthCodesRepository,
    private readonly jwt: JwtService,
    private readonly email: EmailProvider,
  ) {}

  // --- Sign up / sign in ---------------------------------------------------

  async register(dto: RegisterDto): Promise<AuthResultDto> {
    const existing = await this.users.findByEmail(dto.email)
    if (existing) throw new ConflictException('Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.')

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS)
    const row = await this.users.create(dto.email.trim(), passwordHash, dto.name?.trim() || null, dto.phone ?? null)
    const user = this.users.toDto(row)
    sendDiscordAlert(process.env.DISCORD_WEBHOOK_REGISTRATIONS, `🆕 Nuevo registro en DóndeTa: ${user.email}`)

    // Welcome + email confirmation code. Never blocks the sign-up.
    void this.codes
      .issue(row.id, 'verify_email')
      .then(code => this.deliver(row.email, welcomeEmail(row.name, code)))
      .catch(error => this.logger.warn(`welcome email failed: ${String(error)}`))

    return { token: this.sign(user), user }
  }

  async login(dto: LoginDto): Promise<LoginResultDto> {
    const row = await this.users.findByEmail(dto.email.trim())
    if (!row || !(await bcrypt.compare(dto.password, row.password_hash))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.')
    }
    return this.finishSignIn(row)
  }

  // Second step, when the account has one.
  async verifyMfa(dto: MfaVerifyDto): Promise<AuthResultDto> {
    const row = await this.challengeUser(dto.challenge)
    const method = dto.method ?? row.mfa_method
    const ok = method === 'totp'
      ? Boolean(row.totp_secret_enc) && verifyTotp(decryptSecret(row.totp_secret_enc!), dto.code)
      : await this.codes.consume(row.id, 'login', dto.code)
    if (!ok) throw new UnauthorizedException(WRONG_CODE)
    return this.signedIn(row)
  }

  // Emails a sign-in code: the email method's resend, and the fallback for
  // authenticator users who don't have their phone.
  async sendMfaEmail(challenge: string): Promise<{ emailHint: string }> {
    const row = await this.challengeUser(challenge)
    const code = await this.codes.issue(row.id, 'login')
    await this.deliver(row.email, loginCodeEmail(row.name, code))
    return { emailHint: maskEmail(row.email) }
  }

  // --- Password recovery ---------------------------------------------------

  // Always answers the same, so it can't be used to find out who has an
  // account. A code is emailed only when the account exists.
  async forgotPassword(email: string): Promise<{ ok: true }> {
    const row = await this.users.findByEmail(email.trim())
    if (row) {
      try {
        const code = await this.codes.issue(row.id, 'reset_password')
        await this.deliver(row.email, resetPasswordEmail(row.name, code))
      } catch (error) {
        if (!(error instanceof HttpException)) this.logger.warn(`reset email failed: ${String(error)}`)
      }
    }
    return { ok: true }
  }

  // The code proves the inbox, so it also confirms the email. Signs the user
  // in, except that an authenticator account still needs its app code.
  async resetPassword(dto: ResetPasswordDto): Promise<LoginResultDto> {
    const row = await this.users.findByEmail(dto.email.trim())
    if (!row || !(await this.codes.consume(row.id, 'reset_password', dto.code))) {
      throw new BadRequestException(WRONG_CODE)
    }
    await this.users.updatePassword(row.id, await bcrypt.hash(dto.password, SALT_ROUNDS))
    await this.users.markEmailVerified(row.id)
    this.notify(row.email, passwordChangedEmail(row.name))
    const fresh = (await this.users.findById(row.id))!
    return fresh.mfa_method === 'totp' ? this.challenge(fresh, 'totp') : this.signedIn(fresh)
  }

  // --- Email verification --------------------------------------------------

  async sendVerification(userId: string): Promise<{ emailHint: string; alreadyVerified: boolean }> {
    const row = await this.requireUser(userId)
    if (row.email_verified_at) return { emailHint: maskEmail(row.email), alreadyVerified: true }
    const code = await this.codes.issue(row.id, 'verify_email')
    await this.deliver(row.email, verifyEmailEmail(row.name, code))
    return { emailHint: maskEmail(row.email), alreadyVerified: false }
  }

  async verifyEmail(userId: string, code: string): Promise<UserDto> {
    const row = await this.requireUser(userId)
    if (!row.email_verified_at && !(await this.codes.consume(row.id, 'verify_email', code))) {
      throw new BadRequestException(WRONG_CODE)
    }
    await this.users.markEmailVerified(row.id)
    return this.me(userId)
  }

  // --- Security settings ---------------------------------------------------

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<AuthResultDto> {
    const row = await this.requireUser(userId)
    await this.checkPassword(row, dto.currentPassword)
    await this.users.updatePassword(row.id, await bcrypt.hash(dto.newPassword, SALT_ROUNDS))
    this.notify(row.email, passwordChangedEmail(row.name))
    // Other devices are signed out; this one gets a fresh token.
    return this.signedIn((await this.users.findById(row.id))!)
  }

  async enableEmailMfa(userId: string, password: string): Promise<UserDto> {
    const row = await this.requireUser(userId)
    await this.checkPassword(row, password)
    if (!row.email_verified_at) throw new ForbiddenException('Primero confirma tu correo para recibir los códigos.')
    await this.users.setMfaMethod(row.id, 'email')
    this.notify(row.email, mfaChangedEmail(row.name, 'email'))
    return this.me(userId)
  }

  // Step 1 for the authenticator app. When the account already has one (an
  // admin's, migration 015) it is reused: the user just confirms a code.
  async setupTotp(userId: string, password: string): Promise<{ secret: string | null; otpauthUrl: string | null; reuseExisting: boolean }> {
    const row = await this.requireUser(userId)
    await this.checkPassword(row, password)
    if (row.totp_secret_enc) return { secret: null, otpauthUrl: null, reuseExisting: true }
    const secret = generateSecret()
    await this.users.setTotpPending(row.id, encryptSecret(secret))
    return { secret, otpauthUrl: otpauthUrl(row.email, secret, 'DóndeTa'), reuseExisting: false }
  }

  async enableTotp(userId: string, code: string): Promise<UserDto> {
    const row = await this.requireUser(userId)
    if (row.totp_secret_enc && !row.totp_pending_enc) {
      if (!verifyTotp(decryptSecret(row.totp_secret_enc), code)) throw new BadRequestException(WRONG_CODE)
      await this.users.setMfaMethod(row.id, 'totp')
    } else {
      if (!row.totp_pending_enc) throw new BadRequestException('Primero escanea el código QR.')
      if (!verifyTotp(decryptSecret(row.totp_pending_enc), code)) throw new BadRequestException(WRONG_CODE)
      await this.users.activateTotp(row.id)
    }
    this.notify(row.email, mfaChangedEmail(row.name, 'totp'))
    return this.me(userId)
  }

  async disableMfa(userId: string, password: string): Promise<UserDto> {
    const row = await this.requireUser(userId)
    await this.checkPassword(row, password)
    await this.users.setMfaMethod(row.id, null)
    // Admins keep their authenticator: the admin portal still requires it.
    if (!adminEmails().has(row.email.toLowerCase())) await this.users.clearTotp(row.id)
    this.notify(row.email, mfaChangedEmail(row.name, null))
    return this.me(userId)
  }

  async logoutEverywhere(userId: string): Promise<AuthResultDto> {
    const row = await this.requireUser(userId)
    await this.users.revokeSessions(row.id)
    return this.signedIn((await this.users.findById(row.id))!)
  }

  async deleteAccount(userId: string, password: string): Promise<{ deleted: true }> {
    const row = await this.requireUser(userId)
    await this.checkPassword(row, password)
    await this.users.delete(row.id)
    this.notify(row.email, accountDeletedEmail(row.name))
    sendDiscordAlert(process.env.DISCORD_WEBHOOK_REGISTRATIONS, `👋 Cuenta eliminada en DóndeTa: ${row.email}`)
    return { deleted: true }
  }

  async me(userId: string): Promise<UserDto> {
    return this.users.toDto(await this.requireUser(userId))
  }

  // --- Helpers -------------------------------------------------------------

  private async finishSignIn(row: UserRow): Promise<LoginResultDto> {
    return row.mfa_method ? this.challenge(row, row.mfa_method) : this.signedIn(row)
  }

  private async challenge(row: UserRow, method: MfaMethod): Promise<MfaChallengeResultDto> {
    let emailHint: string | null = null
    if (method === 'email') {
      try {
        const code = await this.codes.issue(row.id, 'login')
        await this.deliver(row.email, loginCodeEmail(row.name, code))
      } catch (error) {
        // A code from the last minute is still valid; just don't send another.
        if (!(error instanceof HttpException)) throw error
      }
      emailHint = maskEmail(row.email)
    }
    const challenge = this.jwt.sign({ sub: row.id, purpose: 'mfa' }, { expiresIn: CHALLENGE_TTL })
    return { mfaRequired: true, challenge, method, emailHint }
  }

  private async challengeUser(challenge: string): Promise<UserRow> {
    let payload: { sub?: string; purpose?: string }
    try {
      payload = await this.jwt.verifyAsync(challenge)
    } catch {
      throw new UnauthorizedException('El inicio de sesión venció. Vuelve a escribir tu contraseña.')
    }
    if (payload.purpose !== 'mfa' || !payload.sub) throw new UnauthorizedException('Inicio de sesión inválido.')
    return this.requireUser(payload.sub)
  }

  private signedIn(row: UserRow): AuthResultDto {
    const user = this.users.toDto(row)
    return { token: this.sign(user), user }
  }

  private async requireUser(userId: string): Promise<UserRow> {
    const row = await this.users.findById(userId)
    if (!row) throw new NotFoundException('No encontramos tu cuenta.')
    return row
  }

  // 403, not 401: the session is fine, only the confirmation is wrong. Clients
  // treat 401 on an authenticated request as "signed out".
  private async checkPassword(row: UserRow, password: string): Promise<void> {
    if (!(await bcrypt.compare(password, row.password_hash))) throw new ForbiddenException('Contraseña incorrecta.')
  }

  private deliver(to: string, content: EmailContent): Promise<void> {
    return this.email.send(to, content.subject, content.text, content.html)
  }

  // Fire-and-forget notices: a failed email never undoes the action.
  private notify(to: string, content: EmailContent): void {
    this.deliver(to, content).catch(error => this.logger.warn(`notice email failed: ${String(error)}`))
  }

  private sign(user: UserDto): string {
    return this.jwt.sign({ sub: user.id })
  }
}
