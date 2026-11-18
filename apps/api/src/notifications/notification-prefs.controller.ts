import { BadRequestException, Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard'
import { PROMOTIONAL_TYPES, parsePrefsPatch } from './notification-prefs'
import { NotificationPrefsRepository } from './notification-prefs.repository'

// Perfil › Notificaciones: one switch per watch notification type. Every
// sender (email and push) checks these before sending.
@UseGuards(JwtAuthGuard)
@Controller('me/notification-preferences')
export class NotificationPrefsController {
  constructor(private readonly prefs: NotificationPrefsRepository) {}

  @Get()
  async get(@Req() req: AuthenticatedRequest) {
    return { prefs: await this.prefs.get(req.userId), promotional: PROMOTIONAL_TYPES }
  }

  @Put()
  async update(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = parsePrefsPatch(body)
    if (!parsed.ok) throw new BadRequestException(parsed.error)
    return { prefs: await this.prefs.update(req.userId, parsed.patch), promotional: PROMOTIONAL_TYPES }
  }
}
