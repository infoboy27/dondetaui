import { Body, Controller, Delete, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard'
import { SearchHistoryService } from './search-history.service'
import { RecordSearchDto } from './search-history.types'

@UseGuards(JwtAuthGuard)
@Controller('me/search-history')
export class SearchHistoryController {
  constructor(private readonly history: SearchHistoryService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.history.list(req.userId)
  }

  @Post()
  @HttpCode(204)
  record(@Req() req: AuthenticatedRequest, @Body() dto: RecordSearchDto) {
    return this.history.record(req.userId, dto.query)
  }

  @Delete()
  @HttpCode(204)
  clear(@Req() req: AuthenticatedRequest) {
    return this.history.clear(req.userId)
  }
}
