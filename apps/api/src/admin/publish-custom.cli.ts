import 'reflect-metadata'
import { readFileSync } from 'node:fs'
import { Pool } from 'pg'
import { InstagramService } from './instagram.service'

// Server-side twin of /admin/instagram -> "Publicación propia": publishes
// JPEG files from disk as a post, a carousel (2-10 files) or a story, through
// the same InstagramService (so it shows in the admin history).
//
//   node dist/admin/publish-custom.cli.js --target feed --caption caption.txt a.jpg b.jpg
//   node dist/admin/publish-custom.cli.js --target story s.jpg
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/+$/, '')
if (!/^https:\/\//.test(siteUrl)) throw new Error('SITE_URL (https) is required')

const args = process.argv.slice(2)
const option = (name: string) => {
  const index = args.indexOf(name)
  if (index < 0) return undefined
  const [value] = args.splice(index, 2).slice(1)
  return value
}
const target = option('--target') === 'story' ? 'story' : 'feed'
const captionFile = option('--caption')
const caption = captionFile ? readFileSync(captionFile, 'utf8').trim() : ''
const files = args

if (!files.length || (target === 'story' && files.length !== 1) || files.length > 10) {
  throw new Error('Usage: --target feed|story [--caption file.txt] image.jpg [...] (story: 1 image; feed: 1-10)')
}
if (target === 'feed' && (!caption || caption.length > 2_200)) throw new Error('A feed post needs a caption of 1-2,200 characters')
const jpegs = files.map(file => {
  const data = readFileSync(file)
  if (data[0] !== 0xff || data[1] !== 0xd8) throw new Error(`${file} is not a JPEG`)
  return data
})

async function main() {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 })
  try {
    const carousel = jpegs.length > 1
    const result = await new InstagramService(pool).publishPost({
      productId: null,
      kind: 'promo',
      target,
      format: carousel ? 'carousel' : 'image',
      caption: target === 'story' ? caption || 'Historia' : caption,
      cover: jpegs[0],
      media: carousel ? jpegs.map(data => ({ contentType: 'image/jpeg' as const, data })) : [],
      publicBaseUrl: siteUrl,
      source: 'manual',
    })
    console.log(JSON.stringify(result))
  } finally {
    await pool.end()
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
