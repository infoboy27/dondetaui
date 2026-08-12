import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { AlertsModule } from './alerts/alerts.module'
import { AlertingThrottlerGuard } from './common/alerting-throttler.guard'
import { AuthModule } from './auth/auth.module'
import { DatabaseModule } from './database/database.module'
import { FavoritesModule } from './favorites/favorites.module'
import { HealthController } from './health/health.controller'
import { NotificationsModule } from './notifications/notifications.module'
import { ProductsModule } from './products/products.module'
import { ReviewsModule } from './reviews/reviews.module'
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
    ReviewsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: AlertingThrottlerGuard }],
})
export class AppModule {}
