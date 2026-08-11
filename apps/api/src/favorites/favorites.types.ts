import { IsUUID } from 'class-validator'

export class CreateFavoriteDto {
  @IsUUID()
  productId!: string
}

export interface FavoriteDto {
  productId: string
  createdAt: string
}
