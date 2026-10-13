import { ApiError } from './http'

// Turns any thrown error into a sentence a shopper can act on. Raw messages
// (native exceptions, stack-ish API text) never reach the screen.
export function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status >= 500) return 'DóndeTa no responde en este momento. Intenta de nuevo en unos segundos.'
    if (error.status === 429) return 'Demasiadas solicitudes seguidas. Espera un momento e intenta de nuevo.'
    return fallback
  }
  // fetch() rejects with a TypeError when there is no connection.
  if (error instanceof TypeError) return 'Revisa tu conexión a internet e intenta de nuevo.'
  return fallback
}

// Account screens: the API's own 4xx messages are already written for the
// shopper (wrong code, wrong password, email taken...), so show them as is.
export function accountError(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status < 500 && error.message) return error.message
  if (error instanceof Error && !(error instanceof ApiError) && !(error instanceof TypeError) && error.message) return error.message
  return friendlyError(error, fallback)
}
