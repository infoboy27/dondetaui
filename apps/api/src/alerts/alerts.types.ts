import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator'
import type { ProductDto } from '../products/products.types'

export class CreateAlertDto {
  @IsUUID()
  productId!: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetPrice?: number
}

export interface AlertDto {
  productId: string
  targetPrice: number | null
  createdAt: string
  product: ProductDto
}
