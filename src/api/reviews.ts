import { apiFetch } from './http'
import type { ReportReason } from '../domain/reviewBlocks'

export interface Review {
  id: string
  userName: string
  /** Same for all of an author's reviews (not the user id): "Ocultar reseñas de este usuario". */
  authorKey?: string
  rating: number
  comment: string | null
  createdAt: string
}

export interface ReviewSummary {
  average: number
  count: number
  reviews: Review[]
}

const json = (body: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const reviewsApi = {
  list(productId: string): Promise<ReviewSummary> {
    return apiFetch<ReviewSummary>(`/products/${encodeURIComponent(productId)}/reviews`)
  },

  submit(productId: string, rating: number, comment?: string): Promise<Review> {
    return apiFetch<Review>('/me/reviews', { method: 'POST', ...json({ productId, rating, comment }) })
  },

  report(reviewId: string, reason: ReportReason): Promise<{ reported: true; hidden: boolean }> {
    return apiFetch(`/me/reviews/${encodeURIComponent(reviewId)}/report`, { method: 'POST', ...json({ reason }) })
  },

  async blockedAuthors(): Promise<string[]> {
    return (await apiFetch<{ authorKeys: string[] }>('/me/blocked-authors')).authorKeys
  },

  blockAuthor(authorKey: string): Promise<unknown> {
    return apiFetch('/me/blocked-authors', { method: 'PUT', ...json({ authorKey }) })
  },
}
