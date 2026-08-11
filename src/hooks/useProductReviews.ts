import { useEffect, useState } from 'react'
import { reviewsApi, type Review } from '../api/reviews'
import { appConfig } from '../config/env'

interface ReviewsState {
  reviews: Review[]
  average: number
  count: number
  loading: boolean
  error: string | null
}

const EMPTY: ReviewsState = { reviews: [], average: 0, count: 0, loading: false, error: null }

// No fixture data for reviews (unlike products/stores) -- fixture mode just
// shows the honest empty state instead of fabricating review content.
export function useProductReviews(productId: string) {
  const [state, setState] = useState<ReviewsState>(EMPTY)

  useEffect(() => {
    if (!appConfig.useApi) {
      setState(EMPTY)
      return
    }

    let cancelled = false
    setState(current => ({ ...current, loading: true, error: null }))

    reviewsApi.list(productId)
      .then(summary => { if (!cancelled) setState({ ...summary, loading: false, error: null }) })
      .catch(error => {
        if (!cancelled) {
          setState({
            ...EMPTY,
            error: error instanceof Error ? error.message : 'No se pudieron cargar las reseñas',
          })
        }
      })

    return () => { cancelled = true }
  }, [productId])

  const submit = async (rating: number, comment?: string) => {
    const review = await reviewsApi.submit(productId, rating, comment)
    setState(current => {
      // Upsert: a re-submit reuses the same review id (one review per user
      // per product), so filtering it out before prepending handles both
      // "first review" and "edited review" without double-counting.
      const reviews = [review, ...current.reviews.filter(r => r.id !== review.id)]
      const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      return { reviews, average, count: reviews.length, loading: false, error: null }
    })
  }

  return { ...state, submit }
}
