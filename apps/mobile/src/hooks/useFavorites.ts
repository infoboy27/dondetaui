import { useEffect, useState } from 'react'
import { favoritesApi, type Favorite } from '../api/favorites'
import type { User } from '../types'

interface FavoritesState {
  favorites: Favorite[]
  loading: boolean
  error: string | null
}

export function useFavorites(user: User | null) {
  const [state, setState] = useState<FavoritesState>({ favorites: [], loading: false, error: null })

  useEffect(() => {
    if (!user) {
      setState({ favorites: [], loading: false, error: null })
      return
    }

    let cancelled = false
    setState(current => ({ ...current, loading: true, error: null }))

    favoritesApi.list()
      .then(favorites => { if (!cancelled) setState({ favorites, loading: false, error: null }) })
      .catch(error => {
        if (!cancelled) {
          setState({
            favorites: [],
            loading: false,
            error: error instanceof Error ? error.message : 'No se pudieron cargar los favoritos',
          })
        }
      })

    return () => { cancelled = true }
  }, [user])

  const create = async (productId: string) => {
    const favorite = await favoritesApi.create(productId)
    setState(current => ({
      ...current,
      favorites: [favorite, ...current.favorites.filter(f => f.productId !== productId)],
    }))
  }

  const remove = async (productId: string) => {
    await favoritesApi.remove(productId)
    setState(current => ({ ...current, favorites: current.favorites.filter(f => f.productId !== productId) }))
  }

  return { ...state, create, remove }
}
