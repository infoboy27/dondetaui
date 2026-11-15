import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { getProductBySlug, getProductPriceCheck } from '../../../../lib/api'
import { formatPrice } from '../../../../lib/format'
import { rankOffers } from '../../../../lib/offers'
import { CARD_HEIGHT, CARD_WIDTH, cardVerdict, recentHistory, sparklinePath, titleSize, type CardVerdict } from '../../../../lib/shareCard'
import { SITE_URL } from '../../../../lib/site'
import { colors } from '../../../../lib/tokens'

// The product's share card: the 1200x630 PNG WhatsApp (and Facebook, X...)
// shows under a shared /product/<slug> link. generateMetadata points
// og:image / twitter:image here with ?v=<price>, so a new price is a new
// URL and WhatsApp's own cache never shows an old one.
//
// Rendered with next/og (satori + resvg, bundled with Next). Fonts and logos
// are files in assets/og, shipped in the standalone build through
// outputFileTracingIncludes (next.config.ts).

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ASSETS = path.join(process.cwd(), 'assets', 'og')

let assets: Promise<{ fonts: { name: string; data: Buffer; weight: 500 | 600 | 700 }[]; logo: string; mark: string }> | null = null

function loadAssets() {
  assets ??= (async () => {
    const file = (name: string) => readFile(path.join(ASSETS, name))
    const [poppins600, poppins700, dmSans500, dmSans700, logo, mark] = await Promise.all([
      file('poppins-latin-600-normal.woff'),
      file('poppins-latin-700-normal.woff'),
      file('dm-sans-latin-500-normal.woff'),
      file('dm-sans-latin-700-normal.woff'),
      file('dondeta-logo.png'),
      file('dondeta-mark.png'),
    ])
    return {
      fonts: [
        { name: 'Poppins', data: poppins600, weight: 600 as const },
        { name: 'Poppins', data: poppins700, weight: 700 as const },
        { name: 'DM Sans', data: dmSans500, weight: 500 as const },
        { name: 'DM Sans', data: dmSans700, weight: 700 as const },
      ],
      logo: `data:image/png;base64,${logo.toString('base64')}`,
      mark: `data:image/png;base64,${mark.toString('base64')}`,
    }
  })()
  assets.catch(() => { assets = null })
  return assets
}

// Store photos come as JPEG, PNG or WebP (Sirena); satori can't draw WebP,
// so every photo goes through sharp: fitted to the card, flattened on white
// (the photo panel's color) and handed over as PNG. Any failure falls back
// to the DóndeTa mark rather than failing the whole card.
async function productPhoto(url: string): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) return null
  try {
    // Same Referer the browser sends: some store CDNs refuse other sites.
    const response = await fetch(url, {
      headers: { Referer: `${SITE_URL}/` },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    })
    if (!response.ok || !(response.headers.get('content-type') ?? '').startsWith('image/')) return null
    if (Number(response.headers.get('content-length') ?? 0) > 8_000_000) return null
    const body = Buffer.from(await response.arrayBuffer())
    if (body.length === 0 || body.length > 8_000_000) return null
    const png = await sharp(body)
      .resize(PHOTO, PHOTO, { fit: 'inside', withoutEnlargement: false })
      .flatten({ background: '#ffffff' })
      .png()
      .toBuffer()
    return `data:image/png;base64,${png.toString('base64')}`
  } catch {
    return null
  }
}

// Rendering takes ~100-300 ms; crawlers and WhatsApp re-fetch the same card,
// so keep recent ones per server process. Keyed by slug + ?v (the price).
const CACHE_TTL_MS = 30 * 60_000
const CACHE_MAX = 200
const cache = new Map<string, { at: number; png: Uint8Array<ArrayBuffer> }>()

function cached(key: string): Uint8Array<ArrayBuffer> | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return hit.png
}

function remember(key: string, png: Uint8Array<ArrayBuffer>) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string)
  cache.set(key, { at: Date.now(), png })
}

const HEADERS = {
  'Content-Type': 'image/png',
  // An hour fresh, a day stale-while-revalidate: prices move every few hours
  // and the ?v in the og:image URL changes with them anyway.
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
}

const TONES: Record<CardVerdict['tone'], { bg: string; fg: string }> = {
  good: { bg: colors.primaryLight, fg: colors.primary },
  warn: { bg: '#FFF4E5', fg: '#C46A00' },
  bad: { bg: '#FDECEC', fg: '#D64545' },
}

const PHOTO = 420
const SPARK_W = 220
const SPARK_H = 78

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const version = new URL(request.url).searchParams.get('v') ?? ''
  const key = `${slug}|${version}`
  const hit = cached(key)
  if (hit) return new Response(hit, { headers: HEADERS })

  const product = await getProductBySlug(slug)
  if (!product) return new Response('Not found', { status: 404 })

  const best = rankOffers(product.prices)[0]
  const [{ fonts, logo, mark }, photo, checks] = await Promise.all([
    loadAssets(),
    productPhoto(product.image),
    getProductPriceCheck(product.id),
  ])
  const verdict = cardVerdict(checks, best?.store)
  const history = recentHistory(product.priceHistory, new Date())
  const spark = sparklinePath(history, SPARK_W, SPARK_H, 6)
  const lows = history.map(p => p.price)
  const host = SITE_URL.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

  const image = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: colors.background, padding: 40, fontFamily: 'DM Sans' }}>
        <div
          style={{
            width: PHOTO + 40, height: CARD_HEIGHT - 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: colors.card, borderRadius: 32, border: `2px solid ${colors.border}`,
          }}
        >
          {photo
            ? <img src={photo} width={PHOTO} height={PHOTO} style={{ objectFit: 'contain' }} />
            : <img src={mark} width={197 * 1.2} height={240 * 1.2} />}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 40, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src={logo} width={480 * 0.5} height={134 * 0.5} />
            <div style={{ fontSize: 20, fontWeight: 500, color: colors.navy400 }}>{host}</div>
          </div>

          <div
            style={{
              display: 'block', fontFamily: 'Poppins', fontWeight: 600, fontSize: titleSize(product.name), lineHeight: 1.18,
              color: colors.navy, lineClamp: 3, letterSpacing: '-0.01em',
            }}
          >
            {product.name}
          </div>

          {verdict ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex', fontFamily: 'Poppins', fontWeight: 700, fontSize: 24, color: TONES[verdict.tone].fg,
                  background: TONES[verdict.tone].bg, borderRadius: 999, padding: '6px 18px',
                }}
              >
                {verdict.label}
              </div>
              <div style={{ display: 'flex', marginLeft: 14, fontSize: 20, fontWeight: 500, color: colors.navy400, flex: 1 }}>
                {verdict.detail}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 500, color: colors.navy400 }}>
              {product.prices.length > 1 ? `Comparado en ${new Set(product.prices.map(o => o.store)).size} tiendas` : 'Precio e historial en DóndeTa'}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 22, fontWeight: 500, color: colors.navy400 }}>
                {best ? 'Mejor precio hoy' : 'Sin precio publicado hoy'}
              </div>
              {best && (
                <div style={{ display: 'flex', fontFamily: 'Poppins', fontWeight: 700, fontSize: 58, lineHeight: 1.05, color: colors.primary, letterSpacing: '-0.02em' }}>
                  {formatPrice(best.price)}
                </div>
              )}
              {best && (
                <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: colors.navy }}>en {best.store}</div>
              )}
            </div>

            {spark && (
              <div
                style={{
                  display: 'flex', flexDirection: 'column', background: colors.card, borderRadius: 20,
                  border: `2px solid ${colors.border}`, padding: '12px 14px 10px',
                }}
              >
                <div style={{ display: 'flex', fontSize: 16, fontWeight: 700, color: colors.navy400 }}>Últimos 30 días</div>
                <svg width={SPARK_W} height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}>
                  <path d={spark} fill="none" stroke={colors.primary} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div style={{ display: 'flex', fontSize: 16, fontWeight: 700, color: colors.navy }}>
                  Mínimo: {formatPrice(Math.min(...lows))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { width: CARD_WIDTH, height: CARD_HEIGHT, fonts },
  )

  // A 256-color palette keeps a photo card around 100 KB instead of 350:
  // WhatsApp skips previews whose image is too heavy.
  const png = new Uint8Array(
    await sharp(Buffer.from(await image.arrayBuffer())).png({ palette: true, quality: 90, effort: 8, compressionLevel: 9 }).toBuffer(),
  )
  remember(key, png)
  return new Response(png, { headers: HEADERS })
}
