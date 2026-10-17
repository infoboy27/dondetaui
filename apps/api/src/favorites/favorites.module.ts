import { Module } from '@nestjs/common'
import { AlertsModule } from '../alerts/alerts.module'
import { AuthModule } from '../auth/auth.module'
import { ProductsModule } from '../products/products.module'
import { FavoritesController } from './favorites.controller'
import { FavoritesRepository } from './favorites.repository'
import { FavoritesService } from './favorites.service'

@Module({
  imports: [AuthModule, ProductsModule, AlertsModule],
  controllers: [FavoritesController],
  providers: [FavoritesRepository, FavoritesService],
})
export class FavoritesModule {}
