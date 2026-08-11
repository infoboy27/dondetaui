import type { Product, ReviewSummary } from './types'

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001/api'

// 5-minute cache: crawler/bot traffic doesn't hammer the DB on every hit,
// but prices don't go stale for long either.
const REVALIDATE_SECONDS = 300

async function apiFetch<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  })
  if (!response.ok) return null
  return response.json() as Promise<T>
}

export function getProductBySlug(slug: string): Promise<Product | null> {
  return apiFetch<Product>(`/products/by-slug/${encodeURIComponent(slug)}`)
}

export function getProductReviews(productId: string): Promise<ReviewSummary> {
  return apiFetch<ReviewSummary>(`/products/${encodeURIComponent(productId)}/reviews`)
    .then(summary => summary ?? { average: 0, count: 0, reviews: [] })
}

export async function getAllProducts(): Promise<Product[]> {
  const products = await apiFetch<Product[]>('/products')
  return products ?? []
}
