import { apiFetch } from './http'

export interface Review {
  id: string
  userName: string
  rating: number
  comment: string | null
  createdAt: string
}

export interface ReviewSummary {
  average: number
  count: number
  reviews: Review[]
}

export const reviewsApi = {
  list(productId: string): Promise<ReviewSummary> {
    return apiFetch<ReviewSummary>(`/products/${encodeURIComponent(productId)}/reviews`)
  },

  submit(productId: string, rating: number, comment?: string): Promise<Review> {
    return apiFetch<Review>('/me/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, rating, comment }),
    })
  },
}
