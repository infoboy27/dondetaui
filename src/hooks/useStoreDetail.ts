import { useEffect, useState } from 'react'
import { storesApi, type Store } from '../api/stores'
import { appConfig } from '../config/env'
import { PRODUCTS, STORES } from '../data/mock'
import type { Product } from '../types'

interface StoreDetailState {
  store: Store | null
  products: Product[]
  loading: boolean
  error: string | null
}

function fixtureStore(abbr: string): { store: Store | null; products: Product[] } {
  const name = Object.keys(STORES).find(key => STORES[key].abbr === abbr)
  if (!name) return { store: null, products: [] }

  const products = PRODUCTS.filter(p => p.prices.some(price => price.store === name))
  return {
    store: {
      id: abbr,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      abbr,
      color: STORES[name].color,
      websiteUrl: null,
      logoUrl: null,
      productCount: products.length,
    },
    products,
  }
}

// Store screens only know the retailer's `abbr` (e.g. from NearbyStoresScreen's mock
// pins), not its slug, so this resolves abbr -> slug via the store list before fetching
// that store's products -- two requests, but the store list is tiny (5 retailers).
export function useStoreDetail(abbr: string | null): StoreDetailState {
  const [state, setState] = useState<StoreDetailState>({ store: null, products: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    if (!abbr) {
      setState({ store: null, products: [], loading: false, error: null })
      return () => { cancelled = true }
    }

    if (!appConfig.useApi) {
      setState({ ...fixtureStore(abbr), loading: false, error: null })
      return () => { cancelled = true }
    }

    const load = async () => {
      setState(current => ({ ...current, loading: true, error: null }))
      try {
        const stores = await storesApi.list()
        const store = stores.find(s => s.abbr === abbr) ?? null
        if (!store) {
          if (!cancelled) setState({ store: null, products: [], loading: false, error: 'Tienda no encontrada' })
          return
        }
        const products = await storesApi.products(store.slug)
        if (!cancelled) setState({ store, products, loading: false, error: null })
      } catch (error) {
        if (!cancelled) {
          setState({
            ...fixtureStore(abbr),
            loading: false,
            error: error instanceof Error ? error.message : 'No se pudo cargar la tienda',
          })
        }
      }
    }

    void load()
    return () => { cancelled = true }
  }, [abbr])

  return state
}
