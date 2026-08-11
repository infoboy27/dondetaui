import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ProductsModule } from '../products/products.module'
import { AlertsController } from './alerts.controller'
import { AlertsRepository } from './alerts.repository'
import { AlertsService } from './alerts.service'

@Module({
  imports: [AuthModule, ProductsModule],
  controllers: [AlertsController],
  providers: [AlertsRepository, AlertsService],
})
export class AlertsModule {}
