import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

// Messages are shown to shoppers as-is, so they're in Spanish.
const EMAIL = { message: 'Escribe un correo válido.' }
const PASSWORD_MIN = { message: 'La contraseña debe tener al menos 8 caracteres.' }
// bcrypt only reads the first 72 bytes; anything far longer is a mistake.
const PASSWORD_MAX = { message: 'La contraseña es demasiado larga.' }
const CODE = { message: 'El código tiene 6 dígitos.' }

export type MfaMethod = 'email' | 'totp'

export class RegisterDto {
  @IsEmail({}, EMAIL)
  email!: string

  @IsString()
  @MinLength(8, PASSWORD_MIN)
  @MaxLength(128, PASSWORD_MAX)
  password!: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string

  // Loose E.164-ish check (optional leading +, 8-15 digits) — real delivery
  // validation happens at the SMS/WhatsApp provider, this just rejects junk input.
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Escribe un número de teléfono válido.' })
  phone?: string
}

export class LoginDto {
  @IsEmail({}, EMAIL)
  email!: string

  @IsString()
  password!: string
}

export class EmailDto {
  @IsEmail({}, EMAIL)
  email!: string
}

export class CodeDto {
  @IsString()
  @Matches(/^\s*\d{3}\s?\d{3}\s*$/, CODE)
  code!: string
}

export class ResetPasswordDto {
  @IsEmail({}, EMAIL)
  email!: string

  @IsString()
  @Matches(/^\s*\d{3}\s?\d{3}\s*$/, CODE)
  code!: string

  @IsString()
  @MinLength(8, PASSWORD_MIN)
  @MaxLength(128, PASSWORD_MAX)
  password!: string
}

export class MfaChallengeDto {
  @IsString()
  challenge!: string
}

export class MfaVerifyDto {
  @IsString()
  challenge!: string

  @IsString()
  @Matches(/^\s*\d{3}\s?\d{3}\s*$/, CODE)
  code!: string

  // 'email' when a TOTP user asked for a code by email instead (lost phone).
  @IsOptional()
  @IsIn(['email', 'totp'])
  method?: MfaMethod
}

export class PasswordDto {
  @IsString()
  password!: string
}

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string

  @IsString()
  @MinLength(8, PASSWORD_MIN)
  @MaxLength(128, PASSWORD_MAX)
  newPassword!: string
}

export interface UserDto {
  id: string
  email: string
  name: string | null
  phone: string | null
  emailVerified: boolean
  mfaMethod: MfaMethod | null
}

export interface AuthResultDto {
  token: string
  user: UserDto
}

// Sign-in paused for the second step: the client sends `challenge` back with
// the code to /auth/mfa/verify. `emailHint` is set when a code was emailed.
export interface MfaChallengeResultDto {
  mfaRequired: true
  challenge: string
  method: MfaMethod
  emailHint: string | null
}

export type LoginResultDto = AuthResultDto | MfaChallengeResultDto
