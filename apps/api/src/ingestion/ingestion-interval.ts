// How long the ingestion worker sleeps between cycles.
//
// Normally every 6 h. Around Black Friday prices change several times a day,
// and a verdict 6 h old on /black-friday ("¿la oferta es real?") loses the
// point, so from the Wednesday before Black Friday through Cyber Monday the
// worker refreshes faster. Dates are in Dominican time (UTC-4, no DST).

const RD_OFFSET_MS = 4 * 60 * 60 * 1000

// Day after the 4th Thursday of November, as a UTC calendar date.
function blackFriday(year: number): number {
  const first = new Date(Date.UTC(year, 10, 1)).getUTCDay()
  const firstThursday = 1 + ((4 - first + 7) % 7)
  return Date.UTC(year, 10, firstThursday + 22)
}

export function isPeakSeason(now: Date): boolean {
  const local = new Date(now.getTime() - RD_OFFSET_MS)
  const today = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
  const days = Math.round((today - blackFriday(local.getUTCFullYear())) / 86_400_000)
  return days >= -2 && days <= 3 // Wednesday .. Cyber Monday
}

export function ingestionIntervalSeconds(env: Record<string, string | undefined>, now = new Date()): number {
  const normal = Number(env.INGESTION_INTERVAL_SECONDS) || 21_600
  const peak = Number(env.INGESTION_PEAK_INTERVAL_SECONDS) || 3_600
  return isPeakSeason(now) ? Math.min(normal, peak) : normal
}
