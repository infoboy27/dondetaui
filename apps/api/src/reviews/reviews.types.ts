import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator'

export class SubmitReviewDto {
  @IsUUID()
  productId!: string

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string
}

export interface ReviewDto {
  id: string
  userName: string
  rating: number
  comment: string | null
  createdAt: string
}

export interface ReviewSummaryDto {
  average: number
  count: number
  reviews: ReviewDto[]
}
