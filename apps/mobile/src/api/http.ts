import { appConfig } from '../config/env'
import { getToken } from '../auth/session'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const headers = new Headers(init?.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const token = await getToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${appConfig.apiBaseUrl}${normalizedPath}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const message = await response
      .clone()
      .json()
      .then((body: { message?: string | string[] }) =>
        Array.isArray(body.message) ? body.message[0] : body.message,
      )
      .catch(() => undefined)

    throw new ApiError(message ?? `DóndeTa API request failed (${response.status})`, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
