import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_VOICE_ID, cacheKey, speak, ttsConfig } from './elevenlabs'

describe('ttsConfig', () => {
  it('is off without a key and defaults the voice and cache folder', () => {
    expect(ttsConfig({})).toBeNull()
    expect(ttsConfig({ ELEVENLABS_API_KEY: ' k ' })).toEqual({ apiKey: 'k', voiceId: DEFAULT_VOICE_ID, cacheDir: '/data/broll/voice' })
    expect(ttsConfig({ ELEVENLABS_API_KEY: 'k', ELEVENLABS_VOICE_ID: 'v', BROLL_DIR: '/b' })).toMatchObject({ voiceId: 'v', cacheDir: '/b/voice' })
  })
})

describe('speak', () => {
  let dir = ''
  afterEach(() => rm(dir, { recursive: true, force: true }))

  it('calls the API once per line and serves the cache after', async () => {
    dir = await mkdtemp(join(tmpdir(), 'tts-'))
    const fetchImpl = vi.fn(async () => new Response(new Uint8Array(2_000), { status: 200 }))
    const config = { apiKey: 'k', voiceId: 'v', cacheDir: dir }
    const first = await speak(config, 'Hola', fetchImpl as unknown as typeof fetch)
    const second = await speak(config, 'Hola', fetchImpl as unknown as typeof fetch)
    expect(first).toEqual({ file: join(dir, `${cacheKey('v', 'Hola')}.mp3`), billed: 4 })
    expect(second.billed).toBe(0)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('/text-to-speech/v?output_format=mp3_44100_128')
    expect(JSON.parse(String(init.body))).toMatchObject({ text: 'Hola', model_id: 'eleven_multilingual_v2' })
  })

  it('fails with the API message', async () => {
    dir = await mkdtemp(join(tmpdir(), 'tts-'))
    const fetchImpl = async () => new Response('quota_exceeded', { status: 401 })
    await expect(speak({ apiKey: 'k', voiceId: 'v', cacheDir: dir }, 'Hola', fetchImpl as unknown as typeof fetch)).rejects.toThrow('ElevenLabs 401: quota_exceeded')
  })
})
