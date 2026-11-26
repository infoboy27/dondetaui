// Perfil › Notificaciones: one switch per kind of watch notification (email
// and push). Mirror of apps/api/src/notifications/notification-prefs.ts --
// keep the type list and defaults in sync. Pure, tested (notificationPrefs.test.ts).

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

export interface NotificationTypeInfo {
  type: NotificationType
  title: string
  description: string
}

// "Tus alertas": about things the user follows, on by default.
export const ALERT_TYPES: readonly NotificationTypeInfo[] = [
  { type: 'back_in_stock', title: 'Volvió a estar disponible', description: 'Cuando algo que guardaste vuelve a tener existencia.' },
  { type: 'lowest_price_90d', title: 'Precio más bajo en 90 días', description: 'Cuando algo que guardaste llega a su precio más bajo en 3 meses.' },
  { type: 'card_discount', title: 'Descuentos con tarjeta', description: 'Cuando una tienda saca un descuento con tarjeta en algo que guardaste.' },
  { type: 'saved_search', title: 'Búsquedas guardadas', description: 'Cuando aparece algo que buscas o baja de tu precio máximo.' },
]

// "Promociones (opcional)": opt-in only, off until the user turns them on.
export const PROMOTIONAL_TYPES: readonly NotificationTypeInfo[] = [
  { type: 'weekly_digest', title: 'Resumen semanal', description: 'Los domingos, qué subió y qué bajó en lo que guardaste.' },
  { type: 'deal_real', title: 'Ofertas reales de temporada', description: 'En Black Friday, cuando algo que guardaste cuesta menos que su promedio de 30 días.' },
]

export function isPromotional(type: NotificationType): boolean {
  return PROMOTIONAL_TYPES.some(info => info.type === type)
}

export function defaultPrefs(): NotificationPrefs {
  const prefs = {} as NotificationPrefs
  for (const type of NOTIFICATION_TYPES) prefs[type] = !isPromotional(type)
  return prefs
}

/** The API answer (or anything unexpected) over the defaults; unknown keys and non-booleans are ignored. */
export function resolvePrefs(raw: unknown): NotificationPrefs {
  const prefs = defaultPrefs()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return prefs
  for (const type of NOTIFICATION_TYPES) {
    const value = (raw as Record<string, unknown>)[type]
    if (typeof value === 'boolean') prefs[type] = value
  }
  return prefs
}

/** Optimistic switch flip; the screen rolls back to `prefs` if the save fails. */
export function withPref(prefs: NotificationPrefs, type: NotificationType, value: boolean): NotificationPrefs {
  return { ...prefs, [type]: value }
}
