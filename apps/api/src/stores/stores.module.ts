import { Module } from '@nestjs/common'
import { ProductsModule } from '../products/products.module'
import { StoresController } from './stores.controller'
import { StoresRepository } from './stores.repository'
import { StoresService } from './stores.service'

@Module({
  imports: [ProductsModule],
  controllers: [StoresController],
  providers: [StoresRepository, StoresService],
})
export class StoresModule {}
