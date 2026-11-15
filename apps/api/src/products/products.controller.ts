import { Controller, Get, Param, Query } from '@nestjs/common'
import { ProductsService } from './products.service'

@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('products')
  list() {
    return this.products.list()
  }

  // Home page sections without the whole catalog (see highlights.ts).
  @Get('products/highlights')
  highlights() {
    return this.products.highlights()
  }

  // Public: the /black-friday page ("¿la oferta es real?").
  @Get('price-check')
  priceCheck() {
    return this.products.priceCheck()
  }

  @Get('search')
  search(@Query('q') query = '') {
    return this.products.search(query)
  }

  @Get('products/barcode/:code')
  barcode(@Param('code') code: string) {
    return this.products.barcode(code)
  }

  @Get('products/by-slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.products.getBySlug(slug)
  }

  @Get('products/:id/offers')
  offers(@Param('id') id: string) {
    return this.products.offers(id)
  }

  // Public: the verdict on a product's share card (web-seo).
  @Get('products/:id/price-check')
  productPriceCheck(@Param('id') id: string) {
    return this.products.productPriceCheck(id)
  }

  @Get('products/:id/history')
  history(@Param('id') id: string) {
    return this.products.history(id)
  }

  @Get('products/:id')
  get(@Param('id') id: string) {
    return this.products.get(id)
  }
}
