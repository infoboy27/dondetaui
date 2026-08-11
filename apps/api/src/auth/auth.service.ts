import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcryptjs'
import { UsersRepository } from './users.repository'
import type { AuthResultDto, LoginDto, RegisterDto, UserDto } from './auth.types'

const SALT_ROUNDS = 10

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResultDto> {
    const existing = await this.users.findByEmail(dto.email)
    if (existing) throw new ConflictException('Email already registered')

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS)
    const row = await this.users.create(dto.email, passwordHash, dto.name ?? null)
    const user = this.users.toDto(row)

    return { token: this.sign(user), user }
  }

  async login(dto: LoginDto): Promise<AuthResultDto> {
    const row = await this.users.findByEmail(dto.email)
    if (!row) throw new UnauthorizedException('Invalid credentials')

    const matches = await bcrypt.compare(dto.password, row.password_hash)
    if (!matches) throw new UnauthorizedException('Invalid credentials')

    const user = this.users.toDto(row)
    return { token: this.sign(user), user }
  }

  async me(userId: string): Promise<UserDto> {
    const row = await this.users.findById(userId)
    if (!row) throw new NotFoundException('User not found')
    return this.users.toDto(row)
  }

  private sign(user: UserDto): string {
    return this.jwt.sign({ sub: user.id })
  }
}
