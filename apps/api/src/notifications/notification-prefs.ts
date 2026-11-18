// Per-user switches for each kind of watch notification (email + push).
// Pure (no Nest / pg imports): tested in the root vitest suite. Mirrored in
// apps/mobile/src/domain/notificationPrefs.ts -- keep both lists in sync.
//
// Only the user's explicit choices are stored (notification_preferences.prefs,
// jsonb); anything missing falls back to the default here, so a type added
// later gets its default without a data migration.

export const NOTIFICATION_TYPES = [
  'back_in_stock',
  'lowest_price_90d',
  'card_discount',
  'saved_search',
  'weekly_digest',
  'deal_real',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]
export type NotificationPrefs = Record<NotificationType, boolean>

// Promotional types are opt-in only (Apple guideline 4.5.4: marketing pushes
// need explicit consent and an in-app way to turn them off).
export const PROMOTIONAL_TYPES: readonly NotificationType[] = ['weekly_digest', 'deal_real']

export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && (NOTIFICATION_TYPES as readonly string[]).includes(value)
}

export function isPromotional(type: NotificationType): boolean {
  return PROMOTIONAL_TYPES.includes(type)
}

/** On for what the user explicitly follows, off for anything promotional. */
export function defaultPrefs(): NotificationPrefs {
  const prefs = {} as NotificationPrefs
  for (const type of NOTIFICATION_TYPES) prefs[type] = !isPromotional(type)
  return prefs
}

/** Stored overrides (any shape, straight from jsonb) over the defaults; unknown keys and non-booleans are ignored. */
export function resolvePrefs(stored: unknown): NotificationPrefs {
  const prefs = defaultPrefs()
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return prefs
  for (const [key, value] of Object.entries(stored as Record<string, unknown>)) {
    if (isNotificationType(key) && typeof value === 'boolean') prefs[key] = value
  }
  return prefs
}

export type PrefsPatchResult =
  | { ok: true; patch: Partial<NotificationPrefs> }
  | { ok: false; error: string }

/** Validates a PUT body: { prefs: { <type>: boolean, ... } } with at least one known type. */
export function parsePrefsPatch(body: unknown): PrefsPatchResult {
  const raw = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>).prefs : undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'Faltan las preferencias.' }
  const patch: Partial<NotificationPrefs> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isNotificationType(key)) return { ok: false, error: 'Ese tipo de aviso no existe.' }
    if (typeof value !== 'boolean') return { ok: false, error: 'Cada aviso se activa o se apaga (sí o no).' }
    patch[key] = value
  }
  if (!Object.keys(patch).length) return { ok: false, error: 'Faltan las preferencias.' }
  return { ok: true, patch }
}

/** Whether a user (stored overrides, or null when they never touched the switches) wants this type. */
export function wants(stored: unknown, type: NotificationType): boolean {
  return resolvePrefs(stored)[type]
}
