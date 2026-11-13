import { access, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import brollLibrary from './broll-library.json'
import type { BrollClip } from './voiced-reel'

// One-off, run BY HAND after changing broll-library.json: downloads the
// manifest's clips that are missing from BROLL_DIR (stock footage for the
// voiced Reels). One Pixabay API request per missing clip -- Pixabay forbids
// automated mass queries, which is why the autopilot never searches, it only
// picks from this reviewed library.
//
//   docker compose --profile ingestion run --rm --entrypoint node instagram-autopilot dist/admin/broll-fetch.cli.js

const dir = process.env.BROLL_DIR || '/data/broll'
const key = process.env.PIXABAY_API_KEY?.trim()

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
  if (!key) throw new Error('PIXABAY_API_KEY is required')
  await mkdir(dir, { recursive: true })
  let fetched = 0
  for (const clip of brollLibrary as BrollClip[]) {
    const file = join(dir, clip.file)
    if (await access(file).then(() => true, () => false)) continue
    const lookup = () => fetch(`https://pixabay.com/api/videos/?key=${encodeURIComponent(key)}&id=${encodeURIComponent(clip.id)}`)
    let response = await lookup()
    if (response.status === 429) {
      console.warn('[broll] rate limited; waiting 60 s')
      await sleep(60_000)
      response = await lookup()
    }
    if (!response.ok) throw new Error(`Pixabay ${response.status} for clip ${clip.id}`)
    const data = await response.json() as { hits?: Array<{ videos: Record<string, { url: string }> }> }
    const videos = data.hits?.[0]?.videos
    const url = videos?.medium?.url || videos?.small?.url
    if (!url) {
      console.warn(`[broll] clip ${clip.id} is gone from Pixabay; remove it from broll-library.json`)
      continue
    }
    const video = await fetch(url)
    if (!video.ok) throw new Error(`download ${video.status} for clip ${clip.id}`)
    await writeFile(file, Buffer.from(await video.arrayBuffer()))
    fetched++
    console.log(`[broll] ${clip.id} -> ${file}`)
    await sleep(1_000) // well under 100 requests per minute
  }
  console.log(`[broll] done: ${fetched} downloaded, library has ${(brollLibrary as BrollClip[]).length} clips`)
}

main().catch(error => {
  console.error('[broll] failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
