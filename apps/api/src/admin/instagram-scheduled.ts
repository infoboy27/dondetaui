// Decides what to do with a scheduled Instagram post. Plain module, no imports
// (the root test run loads it before apps/api's dependencies are installed).

export const MAX_ATTEMPTS = 3
// A campaign post says "faltan 3 días" or "hoy es Black Friday": published a
// day late it would be wrong, so past this window it's given up on instead.
export const LATE_LIMIT_MS = 6 * 3_600_000

export type Due = 'wait' | 'publish' | 'missed'

export function dueDecision(publishAt: Date, now: Date): Due {
  const late = now.getTime() - publishAt.getTime()
  if (late < 0) return 'wait'
  return late > LATE_LIMIT_MS ? 'missed' : 'publish'
}
