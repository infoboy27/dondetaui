import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

// Turns the Reel scenes drawn by /ig-render (JPEG stills) into the MP4
// Instagram wants: 1080x1920, H.264 + AAC, 30 fps. Scenes crossfade into each
// other; the ones marked `zoom` get a slow push-in so the video never sits
// still. The audio track is silence -- the API can't attach Instagram's music
// library, and some players choke on a video without any audio stream.

export interface Scene {
  file: string
  seconds: number
  zoom: boolean
}

export const FPS = 30
export const FADE = 0.35
const W = 1080
const H = 1920

export function totalSeconds(scenes: Scene[]): number {
  return scenes.reduce((sum, s) => sum + s.seconds, 0) - FADE * Math.max(0, scenes.length - 1)
}

export function ffmpegArgs(scenes: Scene[], output: string): string[] {
  if (!scenes.length) throw new Error('A Reel needs at least one scene')
  const args: string[] = ['-y']
  for (const scene of scenes) args.push('-loop', '1', '-framerate', String(FPS), '-t', scene.seconds.toFixed(2), '-i', scene.file)
  const total = totalSeconds(scenes)
  args.push('-f', 'lavfi', '-t', total.toFixed(2), '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100')

  const filters: string[] = []
  scenes.forEach((scene, i) => {
    const frames = Math.round(scene.seconds * FPS)
    // Upscale first so zoompan's integer crop steps don't jitter.
    const motion = scene.zoom
      ? `scale=${W * 2}:${H * 2},zoompan=z='1+0.06*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS}`
      : `scale=${W}:${H}`
    // JPEG stills are full-range; video players expect limited (tv) range.
    filters.push(`[${i}:v]${motion},setsar=1,scale=out_range=tv,format=yuv420p[v${i}]`)
  })
  let last = 'v0'
  let offset = 0
  for (let i = 1; i < scenes.length; i++) {
    offset += scenes[i - 1].seconds - FADE
    const out = i === scenes.length - 1 ? 'vout' : `x${i}`
    filters.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[${out}]`)
    last = out
  }
  if (scenes.length === 1) filters.push('[v0]null[vout]')

  args.push(
    '-filter_complex', filters.join(';'),
    '-map', '[vout]', '-map', `${scenes.length}:a`,
    '-c:v', 'libx264', '-preset', 'medium', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-b:v', '6M',
    '-c:a', 'aac', '-b:a', '128k',
    '-shortest', '-movflags', '+faststart',
    output,
  )
  return args
}

const run = promisify(execFile)

export async function buildReel(scenes: Array<{ jpeg: Buffer; seconds: number; zoom: boolean }>): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'reel-'))
  try {
    const files: Scene[] = []
    for (const [i, scene] of scenes.entries()) {
      const file = join(dir, `scene-${i}.jpg`)
      await writeFile(file, scene.jpeg)
      files.push({ file, seconds: scene.seconds, zoom: scene.zoom })
    }
    const output = join(dir, 'reel.mp4')
    await run(process.env.FFMPEG_PATH || 'ffmpeg', ffmpegArgs(files, output), { timeout: 180_000, maxBuffer: 16 * 1024 * 1024 })
    return await readFile(output)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
