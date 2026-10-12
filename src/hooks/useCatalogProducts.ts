import { useCallback, useEffect, useState } from 'react'
import { productsApi } from '../api/products'
import { appConfig } from '../config/env'
import { PRODUCTS } from '../data/mock'
import type { Product } from '../types'

interface CatalogState {
  products: Product[]
  loading: boolean
  source: 'api' | 'fixtures'
  error: string | null
}

interface CatalogResult extends CatalogState {
  retry: () => void
}

// App, Home, Alerts and Notifications all mount this hook at once; without a
// shared request each one downloaded the whole catalog (~1.6 MB) again.
const CATALOG_TTL_MS = 5 * 60 * 1000
let catalogRequest: { promise: Promise<Product[]>; at: number } | null = null

function loadCatalog(): Promise<Product[]> {
  if (catalogRequest && Date.now() - catalogRequest.at < CATALOG_TTL_MS) return catalogRequest.promise
  const promise = productsApi.list()
  catalogRequest = { promise, at: Date.now() }
  // A failed request must not be cached, or a retry would get the same error.
  promise.catch(() => {
    if (catalogRequest?.promise === promise) catalogRequest = null
  })
  return promise
}

export function resetCatalogCache() {
  catalogRequest = null
}

export function useCatalogProducts(query = ''): CatalogResult {
  // With a live API, start empty: seeding the fixtures here flashed fake
  // products on every real page load until the request came back.
  const [state, setState] = useState<CatalogState>({
    products: appConfig.useApi ? [] : PRODUCTS,
    loading: appConfig.useApi,
    source: 'fixtures',
    error: null,
  })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt(n => n + 1), [])

  useEffect(() => {
    let cancelled = false

    if (!appConfig.useApi) {
      setState({ products: PRODUCTS, loading: false, source: 'fixtures', error: null })
      return () => {
        cancelled = true
      }
    }

    const load = async () => {
      setState(current => ({ ...current, loading: true, error: null }))

      try {
        const products = query.trim()
          ? await productsApi.search(query.trim())
          : await loadCatalog()

        if (!cancelled) {
          setState({ products, loading: false, source: 'api', error: null })
        }
      } catch (error) {
        if (!cancelled) {
          // Never fall back to the demo fixtures against the live API: they
          // look like real offers and users can't tell them apart.
          setState({
            products: [],
            loading: false,
            source: 'api',
            error: error instanceof Error ? error.message : 'No se pudo cargar el catálogo',
          })
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [query, attempt])

  return { ...state, retry }
}
