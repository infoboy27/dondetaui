import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../admin/admin.guard'
import { ReviewsService } from './reviews.service'
import { BlockAuthorDto, ReportReviewDto, ReviewBanDto, SubmitReviewDto } from './reviews.types'

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('products/:id/reviews')
  list(@Param('id') id: string) {
    return this.reviews.list(id)
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/reviews')
  submit(@Req() req: AuthenticatedRequest, @Body() dto: SubmitReviewDto) {
    return this.reviews.submit(req.userId, dto)
  }

  // "Reportar" on a review (App Store Guideline 1.2).
  @UseGuards(JwtAuthGuard)
  @Post('me/reviews/:id/report')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  report(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReportReviewDto) {
    return this.reviews.report(id, req.userId, dto.reason)
  }

  // "Ocultar reseñas de este usuario", kept per account.
  @UseGuards(JwtAuthGuard)
  @Get('me/blocked-authors')
  async blocked(@Req() req: AuthenticatedRequest) {
    return { authorKeys: await this.reviews.blockedAuthors(req.userId) }
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/blocked-authors')
  async block(@Req() req: AuthenticatedRequest, @Body() dto: BlockAuthorDto) {
    await this.reviews.blockAuthor(req.userId, dto.authorKey)
    return { blocked: true }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/blocked-authors/:authorKey')
  async unblock(@Req() req: AuthenticatedRequest, @Param('authorKey') authorKey: string) {
    await this.reviews.unblockAuthor(req.userId, authorKey)
    return { blocked: false }
  }
}

// Owner only: reported and hidden reviews (/admin → Reseñas).
@Controller('admin/reviews')
@UseGuards(AdminGuard)
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  queue() {
    return this.reviews.moderationQueue()
  }

  @Post(':id/hide')
  @HttpCode(200)
  hide(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviews.hide(id)
  }

  @Post(':id/unhide')
  @HttpCode(200)
  unhide(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviews.unhide(id)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviews.remove(id)
  }

  // Bans (or unbans) the review's author from posting reviews.
  @Post(':id/ban')
  @HttpCode(200)
  ban(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReviewBanDto) {
    return this.reviews.setBan(id, dto.banned)
  }
}
