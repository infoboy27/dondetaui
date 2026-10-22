import type { PriceCheckReport, Product, ReviewSummary, Store } from './types'

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

// The full catalog is ~2 MB, over Next's 2 MB data-cache limit, so the fetch
// above isn't cached and every call would re-download it. Product pages use
// it for market context, so keep one copy per server process for a few minutes.
const CATALOG_TTL_MS = 10 * 60 * 1000
let catalog: { at: number; products: Product[] } | null = null

export async function getCatalog(): Promise<Product[]> {
  if (catalog && Date.now() - catalog.at < CATALOG_TTL_MS) return catalog.products
  const products = await getAllProducts()
  // Don't pin an empty result (API briefly down) for the whole TTL.
  if (products.length) catalog = { at: Date.now(), products }
  return products.length ? products : catalog?.products ?? []
}

export async function getStores(): Promise<Store[]> {
  const stores = await apiFetch<Store[]>('/stores')
  return stores ?? []
}

export function getStoreBySlug(slug: string): Promise<Store | null> {
  return apiFetch<Store>(`/stores/${encodeURIComponent(slug)}`)
}

export async function getStoreProducts(slug: string): Promise<Product[]> {
  const products = await apiFetch<Product[]>(`/stores/${encodeURIComponent(slug)}/products`)
  return products ?? []
}

export function getPriceCheck(): Promise<PriceCheckReport | null> {
  return apiFetch<PriceCheckReport>('/price-check')
}
