import { BadRequestException, Body, ConflictException, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../admin/admin.guard'
import { parseBroadcast } from './push-messages'
import { PushProvider } from './push.provider'
import { PushTokensRepository } from './push-tokens.repository'

// Same identical text twice within this window is refused: catches a double
// click or a resent form. A different text goes out right away.
const DUPLICATE_WINDOW_MS = 10 * 60_000

// /admin/notificaciones: one-off push to every registered device, the same
// as broadcast-push.cli. Manual and explicit, so it does not depend on
// PUSH_NOTIFICATIONS_ENABLED (that switch is for the automatic price drops).
@Controller('admin/push')
@UseGuards(AdminGuard)
export class PushBroadcastController {
  private readonly logger = new Logger('PushBroadcast')
  private last: { key: string; at: number } | null = null

  constructor(
    private readonly pushTokens: PushTokensRepository,
    private readonly push: PushProvider,
  ) {}

  @Get('devices')
  devices() {
    return this.pushTokens.activeCounts()
  }

  @Post('broadcast')
  async broadcast(@Body() raw: { title?: unknown; body?: unknown }) {
    let input
    try {
      input = parseBroadcast(raw ?? {})
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Datos inválidos')
    }
    const key = `${input.title}\n${input.body}`
    if (this.last && this.last.key === key && Date.now() - this.last.at < DUPLICATE_WINDOW_MS) {
      throw new ConflictException('Esa misma notificación ya se envió hace menos de 10 minutos')
    }
    this.last = { key, at: Date.now() }

    const tokens = await this.pushTokens.activeTokens()
    const outcome = await this.push.send(tokens.map(to => ({ to, title: input.title, body: input.body, sound: 'default' as const })))
    await this.pushTokens.savePendingTickets(outcome.pending)
    await this.pushTokens.disable(outcome.disable)
    this.logger.log(`"${input.title}" sent to ${tokens.length} device(s): ${outcome.pending.length} accepted, ${outcome.disable.length} disabled`)
    return { devices: tokens.length, accepted: outcome.pending.length, disabled: outcome.disable.length }
  }
}
