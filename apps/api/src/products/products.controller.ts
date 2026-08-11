import { Controller, Get, Param, Query } from '@nestjs/common'
import { ProductsService } from './products.service'

const ALLOWED_PAGE_SIZES = [20, 50, 100]
const DEFAULT_PAGE_SIZE = 20

function parsePageSize(raw?: string): number {
  const value = Number(raw)
  return ALLOWED_PAGE_SIZES.includes(value) ? value : DEFAULT_PAGE_SIZE
}

function parsePage(raw?: string): number {
  const value = Number(raw)
  return Number.isInteger(value) && value >= 1 ? value : 1
}

@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('products')
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    if (page === undefined && pageSize === undefined) return this.products.list()
    return this.products.listPaged(parsePage(page), parsePageSize(pageSize))
  }

  @Get('search')
  search(@Query('q') query = '', @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    if (page === undefined && pageSize === undefined) return this.products.search(query)
    return this.products.searchPaged(query, parsePage(page), parsePageSize(pageSize))
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

  @Get('products/:id/history')
  history(@Param('id') id: string) {
    return this.products.history(id)
  }

  @Get('products/:id')
  get(@Param('id') id: string) {
    return this.products.get(id)
  }
}
