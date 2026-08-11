import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AlertsModule } from './alerts/alerts.module'
import { AuthModule } from './auth/auth.module'
import { DatabaseModule } from './database/database.module'
import { FavoritesModule } from './favorites/favorites.module'
import { HealthController } from './health/health.controller'
import { ProductsModule } from './products/products.module'
import { SearchHistoryModule } from './search-history/search-history.module'
import { StoresModule } from './stores/stores.module'

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    AuthModule,
    ProductsModule,
    StoresModule,
    AlertsModule,
    FavoritesModule,
    SearchHistoryModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
