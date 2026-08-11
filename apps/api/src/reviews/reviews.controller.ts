import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard'
import { ReviewsService } from './reviews.service'
import { SubmitReviewDto } from './reviews.types'

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
}
