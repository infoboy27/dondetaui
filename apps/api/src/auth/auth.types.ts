import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  password!: string

  @IsOptional()
  @IsString()
  name?: string

  // Loose E.164-ish check (optional leading +, 8-15 digits) — real delivery
  // validation happens at the SMS/WhatsApp provider, this just rejects junk input.
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'phone must be a valid phone number' })
  phone?: string
}

export class LoginDto {
  @IsEmail()
  email!: string

  @IsString()
  password!: string
}

export interface UserDto {
  id: string
  email: string
  name: string | null
  phone: string | null
}

export interface AuthResultDto {
  token: string
  user: UserDto
}
