import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator'
import { REPORT_REASONS } from './review-moderation'

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

export class ReportReviewDto {
  @IsOptional()
  @IsIn(REPORT_REASONS as unknown as string[])
  reason?: string
}

export class BlockAuthorDto {
  @Matches(/^[0-9a-f]{16}$/)
  authorKey!: string
}

export class ReviewBanDto {
  @IsBoolean()
  banned!: boolean
}

export interface ReviewDto {
  id: string
  userName: string
  /** Same for all of an author's reviews; used to hide that author. Not the user id. */
  authorKey: string
  rating: number
  comment: string | null
  createdAt: string
}

export interface ReviewSummaryDto {
  average: number
  count: number
  reviews: ReviewDto[]
}
