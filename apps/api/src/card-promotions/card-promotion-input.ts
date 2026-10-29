// Validation for promotions entered in the admin portal. Plain module, no Nest
// imports: the root test run (CI's web job) loads it before apps/api's own
// dependencies are installed.

export interface CardPromotionInput {
  retailerSlug: string
  bank: string
  card: string | null
  percent: number
  maxDiscount: number | null
  minPurchase: number
  weekdays: number[] | null
  startsOn: string
  endsOn: string
  termsUrl: string | null
  note: string | null
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

function text(value: unknown, max: number): string | null {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null
  if (trimmed.length > max) throw new Error(`Máximo ${max} caracteres por campo`)
  return trimmed
}

function optionalAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Los montos deben ser números mayores que 0')
  return amount
}

function date(value: unknown, label: string): string {
  const raw = String(value ?? '')
  if (!DATE.test(raw) || Number.isNaN(Date.parse(raw))) throw new Error(`Falta la fecha de ${label}`)
  return raw
}

// Throws an Error with a user-facing (Spanish) message on bad input.
export function parseCardPromotion(body: Record<string, unknown>, today: string): CardPromotionInput {
  const retailerSlug = text(body.retailerSlug, 80)
  if (!retailerSlug) throw new Error('Elige la tienda')
  const bank = text(body.bank, 60)
  if (!bank) throw new Error('Escribe el banco')
  const percent = Number(body.percent)
  if (!Number.isFinite(percent) || percent <= 0 || percent > 90) throw new Error('El descuento debe estar entre 1% y 90%')

  const days = Array.isArray(body.weekdays) ? body.weekdays.map(Number) : []
  if (days.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new Error('Días de la semana inválidos')
  const weekdays = days.length === 0 || days.length === 7 ? null : [...new Set(days)].sort()

  const startsOn = date(body.startsOn, 'inicio')
  const endsOn = date(body.endsOn, 'fin')
  if (endsOn < startsOn) throw new Error('La fecha de fin es anterior a la de inicio')
  if (endsOn < today) throw new Error('Esa promoción ya terminó')

  const termsUrl = text(body.termsUrl, 500)
  if (termsUrl && !/^https:\/\//i.test(termsUrl)) throw new Error('El enlace de condiciones debe empezar por https://')

  return {
    retailerSlug,
    bank,
    card: text(body.card, 60),
    percent,
    maxDiscount: optionalAmount(body.maxDiscount),
    minPurchase: optionalAmount(body.minPurchase) ?? 0,
    weekdays,
    startsOn,
    endsOn,
    termsUrl,
    note: text(body.note, 200),
  }
}

// Calendar date in the Dominican Republic (UTC-4, no daylight saving).
export function dominicanToday(now = new Date()): string {
  return new Date(now.getTime() - 4 * 3_600_000).toISOString().slice(0, 10)
}
