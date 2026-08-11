import { Injectable, NotFoundException } from '@nestjs/common'
import { ProductsRepository } from '../products/products.repository'
import { StoresRepository } from './stores.repository'

@Injectable()
export class StoresService {
  constructor(
    private readonly stores: StoresRepository,
    private readonly products: ProductsRepository,
  ) {}

  list() {
    return this.stores.list()
  }

  async get(slug: string) {
    const store = await this.stores.findBySlug(slug)
    if (!store) throw new NotFoundException('Store not found')
    return store
  }

  async listProducts(slug: string) {
    const ids = await this.stores.productIdsByRetailerSlug(slug)
    const products = await Promise.all(ids.map(id => this.products.findById(id)))
    return products.filter((p): p is NonNullable<typeof p> => p !== null)
  }

  async branches(slug: string) {
    await this.get(slug)
    return this.stores.branchesByRetailerSlug(slug)
  }

  nearby(latitude: number, longitude: number, radiusKm: number) {
    return this.stores.nearby(latitude, longitude, radiusKm)
  }
}
