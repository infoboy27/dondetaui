import { Injectable, NotFoundException } from '@nestjs/common'
import { UsersRepository } from '../auth/users.repository'
import { ProductsRepository } from '../products/products.repository'
import { ReviewsRepository, type ReviewRow } from './reviews.repository'
import type { ReviewDto, ReviewSummaryDto, SubmitReviewDto } from './reviews.types'

// Reviews are public — show a reviewer's first name + last initial rather
// than their full name or email, matching the level of exposure a public
// review site normally shows a stranger.
function displayName(name: string | null): string {
  if (!name?.trim()) return 'Usuario DóndeTa'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1][0]}.`
}

function toDto(row: ReviewRow): ReviewDto {
  return {
    id: row.id,
    userName: displayName(row.user_name),
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at.toISOString(),
  }
}

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviews: ReviewsRepository,
    private readonly products: ProductsRepository,
    private readonly users: UsersRepository,
  ) {}

  async list(productId: string): Promise<ReviewSummaryDto> {
    const [rows, agg] = await Promise.all([
      this.reviews.findByProduct(productId),
      this.reviews.aggregate(productId),
    ])

    return {
      average: agg.average === null ? 0 : Number(agg.average),
      count: Number(agg.count),
      reviews: rows.map(toDto),
    }
  }

  async submit(userId: string, dto: SubmitReviewDto): Promise<ReviewDto> {
    const product = await this.products.findById(dto.productId)
    if (!product) throw new NotFoundException('Product not found')

    const user = await this.users.findById(userId)
    const row = await this.reviews.upsert(userId, dto.productId, dto.rating, dto.comment?.trim() || null)
    return toDto({ ...row, user_name: user?.name ?? null })
  }
}
