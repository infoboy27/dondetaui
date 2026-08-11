import { Module } from '@nestjs/common'
import { DatabaseModule } from './database/database.module'
import { HealthController } from './health/health.controller'
import { ProductsModule } from './products/products.module'
import { StoresModule } from './stores/stores.module'

@Module({
  imports: [DatabaseModule, ProductsModule, StoresModule],
  controllers: [HealthController],
})
export class AppModule {}
