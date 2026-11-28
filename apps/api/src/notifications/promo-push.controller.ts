import { Body, Controller, HttpCode, Put } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { PushTokensRepository } from './push-tokens.repository'
import { PromoPushDto } from './push-tokens.types'

// "Ofertas y recordatorios" (Perfil switch / Home card in the app). No
// account needed: the consent belongs to the device. Only the device that
// holds the Expo token can receive anything sent to it.
@Controller('push/promos')
export class PromoPushController {
  constructor(private readonly pushTokens: PushTokensRepository) {}

  @Put()
  @HttpCode(204)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  set(@Body() dto: PromoPushDto) {
    return this.pushTokens.setPromos(dto.token, dto.platform ?? 'android', dto.promos)
  }
}
