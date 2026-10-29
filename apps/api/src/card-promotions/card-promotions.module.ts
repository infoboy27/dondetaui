import { Module } from '@nestjs/common'
import { AdminGuard, AdminIdentityGuard } from '../admin/admin.guard'
import { AuthModule } from '../auth/auth.module'
import { CardPromotionsController } from './card-promotions.controller'
import { CardPromotionsRepository } from './card-promotions.repository'

@Module({
  imports: [AuthModule],
  controllers: [CardPromotionsController],
  providers: [CardPromotionsRepository, AdminGuard, AdminIdentityGuard],
})
export class CardPromotionsModule {}
