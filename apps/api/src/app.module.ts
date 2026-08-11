import { Module } from '@nestjs/common'
import { AlertsModule } from './alerts/alerts.module'
import { AuthModule } from './auth/auth.module'
import { DatabaseModule } from './database/database.module'
import { HealthController } from './health/health.controller'
import { ProductsModule } from './products/products.module'
import { StoresModule } from './stores/stores.module'

@Module({
  imports: [DatabaseModule, AuthModule, ProductsModule, StoresModule, AlertsModule],
  controllers: [HealthController],
})
export class AppModule {}
