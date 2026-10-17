// Black Friday banner for the home screens. Copy of this file lives in
// apps/mobile/src/domain/blackFriday.ts -- keep both in sync (same as gaming.ts).
//
// Black Friday is the day after the US Thanksgiving (4th Thursday of November),
// the date Dominican retailers follow too. Same rule as apps/web-seo/src/lib/blackFriday.ts.
export const BLACK_FRIDAY_LEAD_DAYS = 45
const DAY_MS = 86_400_000
const DURING_DAYS = 3 // Black Friday through Cyber Monday

export function blackFridayDate(year: number): Date {
  const first = new Date(Date.UTC(year, 10, 1)).getUTCDay() // 0 = Sunday
  const firstThursday = 1 + ((4 - first + 7) % 7)
  return new Date(Date.UTC(year, 10, firstThursday + 21 + 1))
}

export interface BlackFridayBanner {
  title: string
  subtitle: string
}

// null outside the window (more than 45 days before, or after Cyber Monday),
// so the banner disappears by itself with no deploy.
export function blackFridayBanner(now = new Date()): BlackFridayBanner | null {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const days = Math.round((blackFridayDate(now.getUTCFullYear()).getTime() - today) / DAY_MS)

  if (days > BLACK_FRIDAY_LEAD_DAYS || days < -DURING_DAYS) return null
  if (days > 1) return { title: `Black Friday en ${days} días`, subtitle: 'Mira qué ofertas son reales antes de que empiece' }
  if (days === 1) return { title: 'Black Friday es mañana', subtitle: 'Mira qué ofertas son reales antes de que empiece' }
  if (days === 0) return { title: 'Hoy es Black Friday', subtitle: '¿La oferta es real? Compara con el historial de precios' }
  return { title: 'Black Friday sigue', subtitle: '¿La oferta es real? Compara con el historial de precios' }
}
