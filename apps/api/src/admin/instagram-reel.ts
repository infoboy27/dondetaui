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

// ---------------------------------------------------------------------------
// Voiced Reels (Wednesday/Friday): each scene is stock footage filling 9:16
// with a slow push-in, darkened with the brand navy, the transparent overlay
// drawn by /ig-render on top, and the voice line padded with a short tail.
// Scenes are rendered one by one and then joined without re-encoding.

export interface VoicedScene {
  clip: string
  overlay: string
  audio: string
  /** Voice duration + tail. */
  seconds: number
}

export const NAVY_OVERLAY = '0x0F1D2D@0.62'

export function voicedSceneArgs(scene: VoicedScene, output: string): string[] {
  const secs = scene.seconds.toFixed(3)
  const frames = Math.round(scene.seconds * FPS)
  const fill = 1.08 // overscan so the push-in never shows an edge
  const graph = [
    `[0:v]scale=-2:${Math.round(H * fill)},crop=${Math.round(W * fill)}:${Math.round(H * fill)},` +
      `zoompan=z='1+0.04*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS},` +
      `drawbox=x=0:y=0:w=iw:h=ih:color=${NAVY_OVERLAY}:t=fill[bg]`,
    `[bg][1:v]overlay=0:0,fade=t=in:st=0:d=0.25,fade=t=out:st=${Math.max(0, scene.seconds - 0.2).toFixed(3)}:d=0.2,setsar=1,format=yuv420p[v]`,
    `[2:a]apad,atrim=0:${secs},afade=t=in:st=0:d=0.05,aresample=44100,aformat=channel_layouts=stereo[a]`,
  ].join(';')
  return [
    '-y', '-stream_loop', '-1', '-i', scene.clip, '-loop', '1', '-i', scene.overlay, '-i', scene.audio,
    '-filter_complex', graph, '-map', '[v]', '-map', '[a]', '-t', secs, '-r', String(FPS),
    '-c:v', 'libx264', '-preset', 'medium', '-profile:v', 'high', '-crf', '22', '-maxrate', '5M', '-bufsize', '10M', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k',
    output,
  ]
}

export function concatArgs(listFile: string, output: string): string[] {
  return ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', output]
}

// A frame of the video as JPEG (the Reel's cover in instagram_scheduled).
export async function frameJpeg(video: Buffer, atSeconds: number): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'frame-'))
  try {
    const input = join(dir, 'in.mp4')
    const output = join(dir, 'cover.jpg')
    await writeFile(input, video)
    await run(process.env.FFMPEG_PATH || 'ffmpeg', ['-y', '-ss', atSeconds.toFixed(2), '-i', input, '-frames:v', '1', '-q:v', '3', output], { timeout: 60_000 })
    return await readFile(output)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

export async function audioSeconds(file: string): Promise<number> {
  const { stdout } = await run(process.env.FFPROBE_PATH || 'ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { timeout: 30_000 })
  const seconds = Number(String(stdout).trim())
  if (!(seconds > 0)) throw new Error(`No se pudo medir el audio ${file}`)
  return seconds
}

// Per scene: overlay PNG, voice MP3, stock clip and the silence after the line.
export async function buildVoicedReel(scenes: Array<{ png: Buffer; audio: string; clip: string; tail: number }>): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'voiced-'))
  try {
    const parts: string[] = []
    for (const [i, scene] of scenes.entries()) {
      const overlay = join(dir, `overlay-${i}.png`)
      await writeFile(overlay, scene.png)
      const seconds = (await audioSeconds(scene.audio)) + scene.tail
      const part = join(dir, `scene-${i}.mp4`)
      await run(process.env.FFMPEG_PATH || 'ffmpeg', voicedSceneArgs({ clip: scene.clip, overlay, audio: scene.audio, seconds }, part), { timeout: 240_000, maxBuffer: 16 * 1024 * 1024 })
      parts.push(part)
    }
    const list = join(dir, 'concat.txt')
    await writeFile(list, parts.map(p => `file '${p}'\n`).join(''))
    const output = join(dir, 'reel.mp4')
    await run(process.env.FFMPEG_PATH || 'ffmpeg', concatArgs(list, output), { timeout: 120_000, maxBuffer: 16 * 1024 * 1024 })
    return await readFile(output)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
