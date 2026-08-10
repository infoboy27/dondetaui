import { appConfig } from '../config/env'

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
  const response = await fetch(`${appConfig.apiBaseUrl}${normalizedPath}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(`DóndeTa API request failed (${response.status})`, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
