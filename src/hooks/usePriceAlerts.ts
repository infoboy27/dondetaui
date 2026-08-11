import { useEffect, useState } from 'react'
import { alertsApi } from '../api/alerts'
import type { PriceAlert, User } from '../types'

interface PriceAlertsState {
  alerts: PriceAlert[]
  loading: boolean
  error: string | null
}

export function usePriceAlerts(user: User | null) {
  const [state, setState] = useState<PriceAlertsState>({ alerts: [], loading: false, error: null })

  useEffect(() => {
    if (!user) {
      setState({ alerts: [], loading: false, error: null })
      return
    }

    let cancelled = false
    setState(current => ({ ...current, loading: true, error: null }))

    alertsApi.list()
      .then(alerts => { if (!cancelled) setState({ alerts, loading: false, error: null }) })
      .catch(error => {
        if (!cancelled) {
          setState({
            alerts: [],
            loading: false,
            error: error instanceof Error ? error.message : 'No se pudieron cargar las alertas',
          })
        }
      })

    return () => { cancelled = true }
  }, [user])

  const create = async (productId: string, targetPrice?: number) => {
    const alert = await alertsApi.create(productId, targetPrice)
    setState(current => ({
      ...current,
      alerts: [alert, ...current.alerts.filter(a => a.productId !== productId)],
    }))
  }

  const remove = async (productId: string) => {
    await alertsApi.remove(productId)
    setState(current => ({ ...current, alerts: current.alerts.filter(a => a.productId !== productId) }))
  }

  return { ...state, create, remove }
}
