import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { UsersRepository } from '../auth/users.repository'
import { ProductsRepository } from '../products/products.repository'
import { sendDiscordAlert } from '../common/discord-webhook'
import { ReviewsRepository, type ReviewRow } from './reviews.repository'
import type { ReviewDto, ReviewSummaryDto, SubmitReviewDto } from './reviews.types'
import {
  BANNED_MESSAGE,
  OBJECTIONABLE_MESSAGE,
  hasObjectionableContent,
  reportAlertMessage,
  reportReason,
  shouldAutoHide,
} from './review-moderation'

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
    authorKey: row.author_key ?? '',
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
    if (await this.reviews.isBanned(userId)) throw new ForbiddenException(BANNED_MESSAGE)
    const comment = dto.comment?.trim() || null
    if (hasObjectionableContent(comment)) throw new BadRequestException(OBJECTIONABLE_MESSAGE)

    const user = await this.users.findById(userId)
    const row = await this.reviews.upsert(userId, dto.productId, dto.rating, comment)
    return toDto({ ...row, user_name: user?.name ?? null })
  }

  // Any signed-in reader can report a review once. Three reports hide it until
  // the owner looks at it in /admin; every new report pings Discord.
  async report(reviewId: string, reporterId: string, rawReason: unknown): Promise<{ reported: true; hidden: boolean }> {
    const reason = reportReason(rawReason)
    const result = await this.reviews.report(reviewId, reporterId, reason)
    if (!result) throw new NotFoundException('No encontramos esa reseña.')
    let hidden = result.hidden
    if (result.inserted) {
      if (!hidden && shouldAutoHide(result.reports)) {
        hidden = await this.reviews.hide(reviewId, 'reports')
      }
      sendDiscordAlert(process.env.DISCORD_WEBHOOK_ALERTS, reportAlertMessage({
        productName: result.productName,
        comment: result.comment,
        reason,
        reports: result.reports,
        hidden: hidden && !result.hidden,
      }))
    }
    return { reported: true, hidden }
  }

  blockedAuthors(userId: string) {
    return this.reviews.blockedAuthors(userId)
  }

  blockAuthor(userId: string, authorKey: string) {
    return this.reviews.blockAuthor(userId, authorKey)
  }

  unblockAuthor(userId: string, authorKey: string) {
    return this.reviews.unblockAuthor(userId, authorKey)
  }

  // --- Owner (/admin → Reseñas) ---------------------------------------------

  async moderationQueue() {
    const rows = await this.reviews.moderationQueue()
    return rows.map(row => ({
      id: row.id,
      productName: row.product_name,
      productSlug: row.product_slug,
      rating: row.rating,
      comment: row.comment,
      authorName: displayName(row.author_name),
      authorEmail: row.author_email,
      authorBanned: row.author_banned,
      reports: Number(row.reports),
      reasons: row.reasons ?? [],
      hiddenAt: row.hidden_at?.toISOString() ?? null,
      hiddenReason: row.hidden_reason,
      createdAt: row.created_at.toISOString(),
      lastReportAt: row.last_report_at?.toISOString() ?? null,
    }))
  }

  private async must(found: boolean) {
    if (!found) throw new NotFoundException('No encontramos esa reseña.')
  }

  async hide(reviewId: string) {
    await this.must(await this.reviews.hide(reviewId, 'admin'))
    return { hidden: true }
  }

  async unhide(reviewId: string) {
    await this.must(await this.reviews.unhide(reviewId))
    return { hidden: false }
  }

  async remove(reviewId: string) {
    await this.must(await this.reviews.remove(reviewId))
    return { deleted: true }
  }

  async setBan(reviewId: string, banned: boolean) {
    await this.must(await this.reviews.setBan(reviewId, banned))
    return { banned }
  }
}
