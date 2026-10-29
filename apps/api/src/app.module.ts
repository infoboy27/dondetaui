import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { AdminModule } from './admin/admin.module'
import { AlertsModule } from './alerts/alerts.module'
import { AlertingThrottlerGuard } from './common/alerting-throttler.guard'
import { AuthModule } from './auth/auth.module'
import { CardPromotionsModule } from './card-promotions/card-promotions.module'
import { DatabaseModule } from './database/database.module'
import { FavoritesModule } from './favorites/favorites.module'
import { HealthController } from './health/health.controller'
import { NotificationsModule } from './notifications/notifications.module'
import { OutboundController } from './outbound/outbound.controller'
import { ProductsModule } from './products/products.module'
import { ReviewsModule } from './reviews/reviews.module'
import { SearchHistoryModule } from './search-history/search-history.module'
import { StoresModule } from './stores/stores.module'

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      // Shown to shoppers (e.g. too many sign-in attempts), so in Spanish.
      errorMessage: 'Demasiados intentos seguidos. Espera un minuto e intenta de nuevo.',
    }),
    DatabaseModule,
    AuthModule,
    AdminModule,
    ProductsModule,
    StoresModule,
    CardPromotionsModule,
    AlertsModule,
    FavoritesModule,
    SearchHistoryModule,
    ReviewsModule,
    NotificationsModule,
  ],
  controllers: [HealthController, OutboundController],
  providers: [{ provide: APP_GUARD, useClass: AlertingThrottlerGuard }],
})
export class AppModule {}
