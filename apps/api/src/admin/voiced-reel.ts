// Voiced Reels: when the autopilot makes one, and which stock clips go under
// each scene. Plain module, no imports (the root test run loads it before
// apps/api's dependencies are installed).
//
// Wednesday and Friday (Dominican time, DO stack only) the feed Reel gets a
// voice-over (ElevenLabs) over real footage. It's made in the morning and
// queued in instagram_scheduled for 19:00, so there's a review window: the
// preview goes to Discord, and cancelling it in /admin/instagram lets the
// normal autopilot post instead.

export const VOICED_WEEKDAYS = [3, 5] // Wednesday, Friday
export const VOICED_FROM_HOUR = 9
export const VOICED_PUBLISH_HOUR = 19
export const VOICED_MAX_ATTEMPTS = 3
export const RD_OFFSET = '-04:00' // Dominican Republic: UTC-4, no DST

export const voicedLabel = (date: string) => `voiced-reel ${date}`

export function isVoicedDay(weekday: number, country: string): boolean {
  return country === 'DO' && VOICED_WEEKDAYS.includes(weekday)
}

// Rotation counter for the Reel's kind: two per week, so consecutive voiced
// Reels never repeat a kind (src/domain/voicedReel.ts VOICED_ROTATION).
export function voicedSlot(date: string, weekday: number): number {
  const days = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000)
  return Math.floor((days + 3) / 7) * 2 + (weekday === 5 ? 1 : 0) // weeks start on Monday
}

export function publishAt(date: string, hour = VOICED_PUBLISH_HOUR): Date {
  return new Date(`${date}T${String(hour).padStart(2, '0')}:00:00${RD_OFFSET}`)
}

// Day after the 4th Thursday of November (YYYY-MM-DD).
function blackFriday(year: number): number {
  const first = new Date(Date.UTC(year, 10, 1)).getUTCDay()
  return Date.UTC(year, 10, 1 + ((4 - first + 7) % 7) + 22)
}

// From the Wednesday before Black Friday through Cyber Monday the Reel
// points to Black Friday: the email sign-up when it's live, else /black-friday.
export function voicedSeason(date: string, signupLive: boolean): 'black-friday' | 'black-friday-check' | null {
  const day = Date.parse(`${date}T00:00:00Z`)
  const offset = Math.round((day - blackFriday(Number(date.slice(0, 4)))) / 86_400_000)
  if (offset < -2 || offset > 3) return null
  return signupLive ? 'black-friday' : 'black-friday-check'
}

// Christmas clips only make sense in the holidays (Dec 1 - Jan 6).
export function isChristmas(date: string): boolean {
  const md = date.slice(5)
  return md >= '12-01' || md <= '01-06'
}

// ---------------------------------------------------------------------------
// What the autopilot does on a run.

export type ScheduledStatus = 'scheduled' | 'published' | 'failed' | 'missed' | 'cancelled'

// Make today's voiced Reel? Only on a voiced day, from 09:00, once (any row
// for today -- even cancelled -- means it was already made), and while the
// day's attempts last.
export function shouldMakeVoiced(input: { voicedDay: boolean; hour: number; existing: ScheduledStatus | null; failures: number }): boolean {
  return input.voicedDay && input.hour >= VOICED_FROM_HOUR && input.existing === null && input.failures < VOICED_MAX_ATTEMPTS
}

// The regular feed slot on a voiced day: skip it when the voiced Reel has the
// feed covered, wait while it's still being made, post normally (the silent
// Reel) when it was cancelled or couldn't be made.
export type FeedAction = 'post' | 'skip' | 'wait'
export function feedSlotAction(input: { voicedDay: boolean; existing: ScheduledStatus | null; failures: number }): FeedAction {
  if (!input.voicedDay) return 'post'
  if (input.existing === 'cancelled') return 'post'
  if (input.existing) return 'skip'
  return input.failures >= VOICED_MAX_ATTEMPTS ? 'post' : 'wait'
}

// ---------------------------------------------------------------------------
// Stock footage (apps/api/src/admin/broll-library.json, files in BROLL_DIR).

export interface BrollClip {
  id: string
  file: string
  topics: string[]
  seconds?: number
  note?: string
}

export type SceneName = 'hook' | 'product' | 'how' | 'cta'

const APPLIANCE = /electro|estufa|nevera|refrigerador|lavadora|secadora|microondas|horno|licuadora|freidora|abanico|ventilador|aire|climatiz|extractor|calentador|lavaplatos|plancha|tostadora|sandwichera|procesador|dispensador|bebedero|freezer|olla|aspiradora/
const HOME_TV = /televis|tv|barras-de-sonido|audio/

// Topics to try for each scene, best first.
export function sceneTopics(scene: SceneName, categoryId = ''): string[] {
  switch (scene) {
    case 'hook': return ['hook', 'mall']
    case 'product':
      if (HOME_TV.test(categoryId)) return ['home', 'store', 'phone']
      return APPLIANCE.test(categoryId) ? ['appliances', 'home', 'store'] : ['phone', 'store']
    case 'how': return ['store', 'cart', 'mall']
    case 'cta': return ['cta', 'card', 'phone']
  }
}

// One clip per scene: never twice in the same Reel, preferring clips not used
// in the last Reels (`recent`), then the first matching topic. `seed` rotates
// the choice among equally good clips so the same slot doesn't always get the
// same one.
export function pickClips(library: BrollClip[], scenes: Array<{ scene: SceneName; categoryId?: string }>, recent: string[], seed: number, date: string): BrollClip[] | null {
  const usable = library.filter(clip => !clip.topics.includes('christmas') || isChristmas(date))
  const used = new Set<string>()
  const picks: BrollClip[] = []
  for (const [i, { scene, categoryId }] of scenes.entries()) {
    let pick: BrollClip | undefined
    for (const avoidRecent of [true, false]) {
      for (const topic of sceneTopics(scene, categoryId)) {
        const options = usable.filter(c => c.topics.includes(topic) && !used.has(c.id) && !(avoidRecent && recent.includes(c.id)))
        if (options.length) {
          pick = options[(seed + i) % options.length]
          break
        }
      }
      if (pick) break
    }
    if (!pick) return null
    used.add(pick.id)
    picks.push(pick)
  }
  return picks
}

// Silence after each line: a beat after the hook, longer at the end so the
// call to action stays on screen.
export const SCENE_TAILS: Record<SceneName, number> = { hook: 0.3, product: 0.5, how: 0.5, cta: 1.6 }

// Discord rejects attachments above its webhook limit; under it the MP4 itself
// is the preview, otherwise the cover image.
export const DISCORD_MAX_ATTACHMENT = 8 * 1024 * 1024
