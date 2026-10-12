import { useEffect, useState } from 'react'
import { appConfig } from '../config/env'

interface IngestionHealth {
  retailers?: { lastFinishedAt?: string | null; lastStatus?: string | null }[]
}

let freshnessRequest: Promise<Date | null> | null = null

// Most recent finished ingestion run across retailers. Read straight with
// fetch: /health/ingestion answers 503 (with the same body) when a retailer
// needs attention, which apiFetch would turn into an error.
function loadFreshness(): Promise<Date | null> {
  freshnessRequest ??= fetch(`${appConfig.apiBaseUrl}/health/ingestion`, { headers: { Accept: 'application/json' } })
    .then(response => response.json() as Promise<IngestionHealth>)
    .then(body => latestFinishedAt(body))
    .catch(() => {
      freshnessRequest = null
      return null
    })
  return freshnessRequest
}

export function latestFinishedAt(body: IngestionHealth): Date | null {
  const times = (body.retailers ?? [])
    .filter(r => r.lastStatus === 'completed' && r.lastFinishedAt)
    .map(r => new Date(r.lastFinishedAt!).getTime())
    .filter(t => Number.isFinite(t))
  return times.length ? new Date(Math.max(...times)) : null
}

export function formatUpdatedAgo(date: Date, now = new Date()): string {
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000))
  if (minutes < 60) return minutes <= 1 ? 'Precios actualizados hace un momento' : `Precios actualizados hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Precios actualizados hace ${hours} h`
  const days = Math.round(hours / 24)
  return `Precios actualizados hace ${days} ${days === 1 ? 'día' : 'días'}`
}

export function useCatalogFreshness(): string | null {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!appConfig.useApi) return
    let cancelled = false
    void loadFreshness().then(date => {
      if (!cancelled && date) setLabel(formatUpdatedAgo(date))
    })
    return () => { cancelled = true }
  }, [])

  return label
}
