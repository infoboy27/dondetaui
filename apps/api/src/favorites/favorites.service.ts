import { Injectable, NotFoundException } from '@nestjs/common'
import { ProductsRepository } from '../products/products.repository'
import { FavoritesRepository } from './favorites.repository'
import type { CreateFavoriteDto, FavoriteDto } from './favorites.types'

@Injectable()
export class FavoritesService {
  constructor(
    private readonly favorites: FavoritesRepository,
    private readonly products: ProductsRepository,
  ) {}

  async list(userId: string): Promise<FavoriteDto[]> {
    const rows = await this.favorites.findByUser(userId)
    return rows.map(row => ({ productId: row.product_id, createdAt: row.created_at.toISOString() }))
  }

  async create(userId: string, dto: CreateFavoriteDto): Promise<FavoriteDto> {
    const product = await this.products.findById(dto.productId)
    if (!product) throw new NotFoundException('Product not found')

    const row = await this.favorites.create(userId, dto.productId)
    return { productId: row.product_id, createdAt: row.created_at.toISOString() }
  }

  remove(userId: string, productId: string): Promise<void> {
    return this.favorites.remove(userId, productId)
  }
}
