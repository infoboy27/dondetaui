import { useEffect, useMemo, useState } from 'react'
import { reviewsApi, type Review } from '../api/reviews'
import { appConfig } from '../config/env'
import { getToken } from '../auth/session'
import { addBlocked, parseBlocked, withoutBlocked, type ReportReason } from '../domain/reviewBlocks'

interface ReviewsState {
  reviews: Review[]
  average: number
  count: number
  loading: boolean
  error: string | null
}

const EMPTY: ReviewsState = { reviews: [], average: 0, count: 0, loading: false, error: null }
const BLOCKED_KEY = 'dondeta.blockedReviewAuthors'

function readLocalBlocked(): string[] {
  try {
    return parseBlocked(localStorage.getItem(BLOCKED_KEY))
  } catch {
    return []
  }
}

function writeLocalBlocked(keys: string[]) {
  try {
    localStorage.setItem(BLOCKED_KEY, JSON.stringify(keys))
  } catch {
    // Private mode / storage off: the block lasts for this page only.
  }
}

// No fixture data for reviews (unlike products/stores) -- fixture mode just
// shows the honest empty state instead of fabricating review content.
export function useProductReviews(productId: string) {
  const [state, setState] = useState<ReviewsState>(EMPTY)
  const [blocked, setBlocked] = useState<string[]>(readLocalBlocked)

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

    // Signed in: the account's hidden authors, merged with this browser's.
    if (getToken()) {
      reviewsApi.blockedAuthors()
        .then(keys => { if (!cancelled) setBlocked(current => keys.reduce(addBlocked, current)) })
        .catch(() => {})
    }

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

  // Needs a session (the caller asks for login first). A review hidden by
  // reports disappears from the list right away.
  const report = async (reviewId: string, reason: ReportReason) => {
    const result = await reviewsApi.report(reviewId, reason)
    if (result.hidden) setState(current => ({ ...current, reviews: current.reviews.filter(r => r.id !== reviewId) }))
  }

  // Works signed out too (this browser only).
  const hideAuthor = (authorKey: string) => {
    setBlocked(current => {
      const next = addBlocked(current, authorKey)
      writeLocalBlocked(next)
      return next
    })
    if (getToken()) void reviewsApi.blockAuthor(authorKey).catch(() => {})
  }

  const blockedSet = useMemo(() => new Set(blocked), [blocked])
  const visible = useMemo(() => withoutBlocked(state.reviews, blockedSet), [state.reviews, blockedSet])

  return { ...state, reviews: visible, submit, report, hideAuthor }
}
