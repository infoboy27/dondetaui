import { Body, Controller, Delete, HttpCode, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard'
import { PushTokensRepository } from './push-tokens.repository'
import { RegisterPushTokenDto } from './push-tokens.types'

@UseGuards(JwtAuthGuard)
@Controller('me/push-token')
export class PushTokensController {
  constructor(private readonly pushTokens: PushTokensRepository) {}

  @Post()
  @HttpCode(204)
  register(@Req() req: AuthenticatedRequest, @Body() dto: RegisterPushTokenDto) {
    return this.pushTokens.register(req.userId, dto.token, dto.platform ?? 'android')
  }

  @Delete()
  @HttpCode(204)
  unregister(@Req() req: AuthenticatedRequest, @Body() dto: RegisterPushTokenDto) {
    return this.pushTokens.unregister(req.userId, dto.token)
  }
}
