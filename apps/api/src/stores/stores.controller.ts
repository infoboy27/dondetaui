import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common'
import { StoresService } from './stores.service'

@Controller()
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get('stores')
  list() {
    return this.stores.list()
  }

  // Must be registered before 'stores/:slug' -- otherwise Nest matches this
  // path as slug="nearby" on the param route instead.
  @Get('stores/nearby')
  nearby(@Query('lat') lat: string, @Query('lng') lng: string, @Query('radiusKm') radiusKm = '25') {
    const latitude = Number(lat)
    const longitude = Number(lng)
    const radius = Number(radiusKm)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException('lat and lng query params are required numbers')
    }
    return this.stores.nearby(latitude, longitude, Number.isFinite(radius) ? radius : 25)
  }

  @Get('stores/:slug')
  get(@Param('slug') slug: string) {
    return this.stores.get(slug)
  }

  @Get('stores/:slug/products')
  products(@Param('slug') slug: string) {
    return this.stores.listProducts(slug)
  }

  @Get('stores/:slug/branches')
  branches(@Param('slug') slug: string) {
    return this.stores.branches(slug)
  }
}
