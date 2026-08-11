import { useEffect, useState } from 'react'
import { searchHistoryApi } from '../api/searchHistory'
import type { User } from '../types'

const MAX_RECENT = 10

interface SearchHistoryState {
  recent: string[]
  loading: boolean
  error: string | null
}

export function useSearchHistory(user: User | null) {
  const [state, setState] = useState<SearchHistoryState>({ recent: [], loading: false, error: null })

  useEffect(() => {
    if (!user) {
      setState({ recent: [], loading: false, error: null })
      return
    }

    let cancelled = false
    setState(current => ({ ...current, loading: true, error: null }))

    searchHistoryApi.list()
      .then(recent => { if (!cancelled) setState({ recent, loading: false, error: null }) })
      .catch(error => {
        if (!cancelled) {
          setState({
            recent: [],
            loading: false,
            error: error instanceof Error ? error.message : 'No se pudo cargar el historial de búsqueda',
          })
        }
      })

    return () => { cancelled = true }
  }, [user])

  const record = async (query: string) => {
    if (!user || !query.trim()) return
    setState(current => ({
      ...current,
      recent: [query, ...current.recent.filter(q => q !== query)].slice(0, MAX_RECENT),
    }))
    await searchHistoryApi.record(query)
  }

  const clear = async () => {
    setState(current => ({ ...current, recent: [] }))
    await searchHistoryApi.clear()
  }

  return { ...state, record, clear }
}
