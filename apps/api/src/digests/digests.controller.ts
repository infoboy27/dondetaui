import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard'
import { isDigestTopic, isWellFormedToken, type DigestTopic } from './digest-schedule'
import { UnsubscribeDto } from './digests.types'
import { DigestsRepository } from './digests.repository'
import { sendDiscordAlert, signupsWebhook } from '../common/discord-webhook'
import { digestSubscribedMessage } from '../auth/signup-alert'

function topicOf(value: string): DigestTopic {
  if (!isDigestTopic(value)) throw new BadRequestException('Ese boletín no existe.')
  return value
}

// Opt-in email digests (/cuenta/black-friday and the toggle in Perfil).
@UseGuards(JwtAuthGuard)
@Controller('me/digests')
export class DigestsController {
  constructor(private readonly digests: DigestsRepository) {}

  @Get(':topic')
  async status(@Req() req: AuthenticatedRequest, @Param('topic') topic: string) {
    return { subscribed: await this.digests.isSubscribed(req.userId, topicOf(topic)) }
  }

  @Put(':topic')
  async subscribe(@Req() req: AuthenticatedRequest, @Param('topic') topic: string) {
    const name = topicOf(topic)
    const newSubscriber = await this.digests.subscribe(req.userId, name)
    // Only new subscriptions: toggling the switch again doesn't re-announce.
    if (newSubscriber) sendDiscordAlert(signupsWebhook(), digestSubscribedMessage(newSubscriber, name))
    return { subscribed: true }
  }

  @Delete(':topic')
  async unsubscribe(@Req() req: AuthenticatedRequest, @Param('topic') topic: string) {
    await this.digests.unsubscribe(req.userId, topicOf(topic))
    return { subscribed: false }
  }
}

// The "Dejar de recibir estos correos" link opens /cuenta/black-friday?baja=…,
// which posts the token here: no login needed. A POST (not a GET on the link
// itself) so mail scanners that prefetch links don't unsubscribe people.
@Controller('digests')
export class DigestUnsubscribeController {
  constructor(private readonly digests: DigestsRepository) {}

  @Post('unsubscribe')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async unsubscribe(@Body() body: UnsubscribeDto) {
    if (!isWellFormedToken(body.token)) throw new BadRequestException('El enlace no es válido.')
    await this.digests.unsubscribeByToken(body.token)
    // Same answer whether or not it existed: a repeated click is fine.
    return { unsubscribed: true }
  }
}
