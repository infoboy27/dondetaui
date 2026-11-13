// Black Friday is the day after the US Thanksgiving (4th Thursday of
// November) -- the date Dominican retailers follow too.
export function blackFriday(year: number): Date {
  const first = new Date(Date.UTC(year, 10, 1)).getUTCDay() // 0 = Sunday
  const firstThursday = 1 + ((4 - first + 7) % 7)
  return new Date(Date.UTC(year, 10, firstThursday + 21 + 1))
}

export type BlackFridayPhase = { phase: 'before'; days: number; date: Date } | { phase: 'during'; date: Date } | { phase: 'after'; date: Date }

// "during" spans Black Friday through Cyber Monday.
export function blackFridayPhase(now = new Date()): BlackFridayPhase {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const date = blackFriday(now.getUTCFullYear())
  const days = Math.round((date.getTime() - today) / 86_400_000)
  if (days > 0) return { phase: 'before', days, date }
  if (days >= -3) return { phase: 'during', date }
  return { phase: 'after', date }
}

export type SalesEventId = 'black-friday' | 'cyber-monday'

export type SalesEvent = BlackFridayPhase & { id: SalesEventId; name: string; weekday: string; path: string }

// Cyber Monday is three days after Black Friday. Each page counts down to its
// own day; both are "during" from Black Friday through Cyber Monday.
export function salesEvent(id: SalesEventId, now = new Date()): SalesEvent {
  const bf = blackFridayPhase(now)
  const meta = id === 'black-friday'
    ? { id, name: 'Black Friday', weekday: 'viernes', path: '/black-friday' }
    : { id, name: 'Cyber Monday', weekday: 'lunes', path: '/cyber-monday' }
  if (id === 'black-friday') return { ...bf, ...meta }
  const date = new Date(bf.date.getTime() + 3 * 86_400_000)
  if (bf.phase === 'before') return { ...meta, phase: 'before', days: bf.days + 3, date }
  return { ...meta, phase: bf.phase, date }
}
