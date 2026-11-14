import { Module } from '@nestjs/common'
import { AdminGuard, AdminIdentityGuard } from '../admin/admin.guard'
import { AuthModule } from '../auth/auth.module'
import { ProductsModule } from '../products/products.module'
import { AdminReviewsController, ReviewsController } from './reviews.controller'
import { ReviewsRepository } from './reviews.repository'
import { ReviewsService } from './reviews.service'

@Module({
  imports: [AuthModule, ProductsModule],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsRepository, ReviewsService, AdminGuard, AdminIdentityGuard],
})
export class ReviewsModule {}
