import { Injectable, NotFoundException } from '@nestjs/common'
import { ProductsRepository } from './products.repository'

@Injectable()
export class ProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  list() {
    return this.repository.list()
  }

  search(query: string) {
    return this.repository.list(query)
  }

  listPaged(page: number, pageSize: number) {
    return this.repository.listPaged(undefined, page, pageSize)
  }

  searchPaged(query: string, page: number, pageSize: number) {
    return this.repository.listPaged(query, page, pageSize)
  }

  async get(productId: string) {
    const product = await this.repository.findById(productId)
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  async getBySlug(slug: string) {
    const product = await this.repository.findBySlug(slug)
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  offers(productId: string) {
    return this.repository.offers(productId)
  }

  history(productId: string) {
    return this.repository.history(productId)
  }

  async barcode(code: string) {
    const product = await this.repository.findByBarcode(code)
    if (!product) throw new NotFoundException('Barcode not found')
    return product
  }
}
