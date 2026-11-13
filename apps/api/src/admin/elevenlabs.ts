import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Voice-over for the voiced Reels (ElevenLabs text-to-speech). Each line is
// cached on disk by (voice, model, text): the same sentence is never paid
// for twice, e.g. "En DóndeTa comparamos cada precio…" in every Reel.

export const DEFAULT_VOICE_ID = 'qGPLsX3HiC7FqSnZTSCe' // "Mario", Dominican, upbeat
export const MODEL_ID = 'eleven_multilingual_v2'
const VOICE_SETTINGS = { stability: 0.45, similarity_boost: 0.8, style: 0.35 }

export interface TtsConfig {
  apiKey: string
  voiceId: string
  cacheDir: string
}

export function ttsConfig(env: Record<string, string | undefined>): TtsConfig | null {
  const apiKey = env.ELEVENLABS_API_KEY?.trim()
  if (!apiKey) return null
  return {
    apiKey,
    voiceId: env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE_ID,
    cacheDir: join(env.BROLL_DIR?.trim() || '/data/broll', 'voice'),
  }
}

export function cacheKey(voiceId: string, text: string): string {
  return createHash('sha1').update(`${voiceId}|${MODEL_ID}|${text}`).digest('hex').slice(0, 20)
}

// Returns the MP3 file path and how many characters were billed (0 if cached).
export async function speak(config: TtsConfig, text: string, fetchImpl: typeof fetch = fetch): Promise<{ file: string; billed: number }> {
  await mkdir(config.cacheDir, { recursive: true })
  const file = join(config.cacheDir, `${cacheKey(config.voiceId, text)}.mp3`)
  const cached = await readFile(file).catch(() => null)
  if (cached && cached.length > 1_000) return { file, billed: 0 }

  const response = await fetchImpl(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(config.voiceId)}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': config.apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 200)
    throw new Error(`ElevenLabs ${response.status}: ${detail}`)
  }
  const audio = Buffer.from(await response.arrayBuffer())
  if (audio.length < 1_000) throw new Error('ElevenLabs devolvió un audio vacío')
  await writeFile(file, audio)
  return { file, billed: text.length }
}
