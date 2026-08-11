import { Controller, Get, Param } from '@nestjs/common'
import { StoresService } from './stores.service'

@Controller()
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get('stores')
  list() {
    return this.stores.list()
  }

  @Get('stores/:slug')
  get(@Param('slug') slug: string) {
    return this.stores.get(slug)
  }

  @Get('stores/:slug/products')
  products(@Param('slug') slug: string) {
    return this.stores.listProducts(slug)
  }
}
