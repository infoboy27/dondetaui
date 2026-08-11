import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ProductsModule } from '../products/products.module'
import { ReviewsController } from './reviews.controller'
import { ReviewsRepository } from './reviews.repository'
import { ReviewsService } from './reviews.service'

@Module({
  imports: [AuthModule, ProductsModule],
  controllers: [ReviewsController],
  providers: [ReviewsRepository, ReviewsService],
})
export class ReviewsModule {}
