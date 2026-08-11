import { Injectable, NotFoundException } from '@nestjs/common'
import { ProductsRepository } from '../products/products.repository'
import { AlertsRepository } from './alerts.repository'
import type { AlertDto, CreateAlertDto } from './alerts.types'

@Injectable()
export class AlertsService {
  constructor(
    private readonly alerts: AlertsRepository,
    private readonly products: ProductsRepository,
  ) {}

  async list(userId: string): Promise<AlertDto[]> {
    const rows = await this.alerts.findByUser(userId)
    const dtos = await Promise.all(rows.map(row => this.hydrate(row)))
    return dtos.filter((dto): dto is AlertDto => dto !== null)
  }

  async create(userId: string, dto: CreateAlertDto): Promise<AlertDto> {
    const product = await this.products.findById(dto.productId)
    if (!product) throw new NotFoundException('Product not found')

    const row = await this.alerts.create(userId, dto.productId, dto.targetPrice ?? null)
    return {
      productId: row.product_id,
      targetPrice: row.target_price === null ? null : Number(row.target_price),
      createdAt: row.created_at.toISOString(),
      product,
    }
  }

  remove(userId: string, productId: string): Promise<void> {
    return this.alerts.remove(userId, productId)
  }

  private async hydrate(row: {
    product_id: string
    target_price: string | number | null
    created_at: Date
  }): Promise<AlertDto | null> {
    const product = await this.products.findById(row.product_id)
    if (!product) return null

    return {
      productId: row.product_id,
      targetPrice: row.target_price === null ? null : Number(row.target_price),
      createdAt: row.created_at.toISOString(),
      product,
    }
  }
}
