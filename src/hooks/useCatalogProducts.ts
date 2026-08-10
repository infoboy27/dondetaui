import { useEffect, useState } from 'react'
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

export function useCatalogProducts(query = ''): CatalogState {
  const [state, setState] = useState<CatalogState>({
    products: PRODUCTS,
    loading: appConfig.useApi,
    source: 'fixtures',
    error: null,
  })

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
          : await productsApi.list()

        if (!cancelled) {
          setState({ products, loading: false, source: 'api', error: null })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            products: PRODUCTS,
            loading: false,
            source: 'fixtures',
            error: error instanceof Error ? error.message : 'No se pudo cargar el catálogo',
          })
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [query])

  return state
}
