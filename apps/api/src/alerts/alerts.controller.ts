import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard'
import { AlertsService } from './alerts.service'
import { CreateAlertDto } from './alerts.types'

@UseGuards(JwtAuthGuard)
@Controller('me/alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.alerts.list(req.userId)
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateAlertDto) {
    return this.alerts.create(req.userId, dto)
  }

  @Delete(':productId')
  @HttpCode(204)
  remove(@Req() req: AuthenticatedRequest, @Param('productId') productId: string) {
    return this.alerts.remove(req.userId, productId)
  }
}
