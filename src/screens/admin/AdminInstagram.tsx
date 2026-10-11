import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getToken } from '../../auth/session'
import { productsApi } from '../../api/products'
import { adminApi, type InstagramPost, type InstagramStatus } from '../../api/admin'
import { appConfig } from '../../config/env'
import { colors, fonts, radii } from '../../design/tokens'
import { getTopPriceDrops } from '../../domain/notifications'
import { getTopComparisons } from '../../domain/offers'
import type { Product } from '../../types'
import { CARD_HEIGHT, CARD_WIDTH, caption, drawCard, drawStory, ensureFonts, type CardKind } from './instagramCard'

interface Item {
  product: Product
  kind: CardKind
}

const SITE = window.location.host.replace(/^www\./, '')

// Daily Instagram posts made from real data: today's biggest savings between
// stores and the biggest price drops, each as a ready-to-post PNG + caption.
export default function AdminInstagram() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<InstagramStatus | null>(null)
  const [history, setHistory] = useState<InstagramPost[]>([])

  const refreshHistory = () => { adminApi.igHistory().then(setHistory).catch(() => {}) }

  useEffect(() => {
    productsApi.list().then(setProducts).catch(err => setError(err instanceof Error ? err.message : String(err)))
    adminApi.igStatus().then(setStatus).catch(() => setStatus({ configured: false }))
    refreshHistory()
  }, [])
  const canPublish = Boolean(status?.configured && status.username)
  const publishedToday = new Set(
    history.filter(p => p.status === 'published' && p.published_at && Date.now() - Date.parse(p.published_at) < 86_400_000).map(p => `${p.target}-${p.kind}-${p.product_id}`),
  )

  const items = useMemo<Item[]>(() => {
    if (!products) return []
    return [
      ...getTopComparisons(products, 8).map(e => ({ product: e.product, kind: { type: 'comparison', savings: e.savings } as CardKind })),
      ...getTopPriceDrops(products, 4).map(d => ({ product: d.product, kind: { type: 'drop', pct: d.pct, oldPrice: d.oldPrice } as CardKind })),
    ]
  }, [products])

  return (
    <div style={{ minHeight: '100vh', background: colors.background, fontFamily: fonts.body, color: colors.navy }}>
      <header style={{ background: colors.card, borderBottom: `1px solid ${colors.border}`, padding: '14px 16px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/admin" style={{ color: colors.navy400, fontSize: 13 }}>← Admin</Link>
          <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 20 }}>Publicaciones para Instagram</div>
          <span style={{ fontSize: 13, color: colors.navy400 }}>Con los precios de hoy. Descarga la imagen y copia el texto.</span>
        </div>
      </header>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 16px 0' }}>
        <ConnectionBanner status={status} />
      </div>
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 16px 60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 18 }}>
        {error && <div>No se pudo cargar el catálogo: {error}</div>}
        {!products && !error && <div>Cargando…</div>}
        {products && !items.length && <div>Hoy no hay comparaciones ni bajas de precio para publicar.</div>}
        {items.map(item => (
          <CardPreview
            key={`${item.kind.type}-${item.product.id}`}
            item={item}
            canPublish={canPublish}
            publishedToday={publishedToday}
            onPublished={refreshHistory}
          />
        ))}
      </main>
      {history.length > 0 && (
        <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 16px 60px' }}>
          <h2 style={{ fontFamily: fonts.display, fontSize: 17 }}>Publicaciones recientes</h2>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radii.lg, overflow: 'hidden' }}>
            {history.map(post => (
              <div key={post.id} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderBottom: `1px solid ${colors.border}`, fontSize: 13, alignItems: 'center' }}>
                <span style={{ width: 90, color: colors.navy400 }}>{new Date(post.created_at).toLocaleDateString('es-DO')}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.caption.split('\n')[0]}</span>
                {post.status === 'published'
                  ? (post.permalink ? <a href={post.permalink} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontWeight: 700 }}>Ver en Instagram ↗</a> : <span style={{ color: colors.primary }}>Publicado</span>)
                  : post.status === 'failed'
                    ? <span style={{ color: colors.error }} title={post.error ?? ''}>Falló</span>
                    : <span style={{ color: colors.navy400 }}>Publicando…</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

async function loadProductImage(productId: string): Promise<HTMLImageElement | null> {
  try {
    const response = await fetch(`${appConfig.apiBaseUrl}/admin/products/${productId}/image`, {
      headers: { Authorization: `Bearer ${getToken() ?? ''}` },
    })
    if (!response.ok) return null
    // A data: URL, not URL.createObjectURL: the site's CSP allows data: images
    // but not blob:, so blob-backed photos were silently blocked (blank cards).
    const blob = await response.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    const img = new Image()
    img.src = dataUrl
    await img.decode()
    return img
  } catch {
    return null
  }
}

function ConnectionBanner({ status }: { status: InstagramStatus | null }) {
  if (!status) return null
  const base: React.CSSProperties = { borderRadius: radii.md, padding: '10px 14px', fontSize: 13, fontFamily: fonts.body }
  if (status.configured && status.username) {
    return <div style={{ ...base, background: colors.primaryLight, color: colors.primaryDark }}>✅ Conectado a Instagram como <b>@{status.username}</b>. Puedes publicar directamente desde aquí.</div>
  }
  if (status.configured && status.error) {
    return <div style={{ ...base, background: '#FFF0F0', color: colors.error }}>Instagram está configurado pero respondió con un error: {status.error}</div>
  }
  return <div style={{ ...base, background: colors.accentLight, color: colors.navy }}>Instagram no está conectado todavía: puedes descargar las imágenes y publicarlas a mano. Para publicar desde aquí falta <code>IG_ACCESS_TOKEN</code> en el servidor.</div>
}

function CardPreview({ item, canPublish, publishedToday, onPublished }: {
  item: Item
  canPublish: boolean
  publishedToday: Set<string>
  onPublished: () => void
}) {
  const done = (target: 'feed' | 'story') => publishedToday.has(`${target}-${item.kind.type}-${item.product.id}`)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState<'feed' | 'story' | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string; link?: string | null } | null>(null)

  const storyCanvas = () => {
    const story = document.createElement('canvas')
    if (canvasRef.current) drawStory(story, canvasRef.current, item.kind, SITE)
    return story
  }

  const publish = async (target: 'feed' | 'story') => {
    const canvas = canvasRef.current
    if (!canvas) return
    setPublishing(true)
    setResult(null)
    try {
      // Instagram only takes JPEG.
      const imageBase64 = (target === 'story' ? storyCanvas() : canvas).toDataURL('image/jpeg', 0.92)
      const kind = item.kind.type
      const response = await adminApi.igPublish({ productId: item.product.id, kind, target, caption: text, imageBase64 })
      setResult({ ok: true, text: target === 'story' ? '¡Historia publicada!' : '¡Publicado!', link: response.permalink })
      onPublished()
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : String(err) })
      onPublished()
    } finally {
      setPublishing(false)
      setConfirming(null)
    }
  }
  const text = caption(item.product, item.kind, SITE)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await ensureFonts()
      const image = await loadProductImage(item.product.id)
      if (cancelled || !canvasRef.current) return
      drawCard(canvasRef.current, item.product, item.kind, image, SITE)
      setReady(true)
    })()
    return () => { cancelled = true }
  }, [item])

  const download = (target: 'feed' | 'story') => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    const slug = (item.product.slug || item.product.id).slice(0, 60)
    link.download = `dondeta-${target === 'story' ? 'historia-' : ''}${item.kind.type === 'comparison' ? 'comparacion' : 'baja'}-${slug}.png`
    link.href = (target === 'story' ? storyCanvas() : canvas).toDataURL('image/png')
    link.click()
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard blocked: the text is visible to copy by hand */ }
  }

  return (
    <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radii.lg, padding: 12, display: 'grid', gap: 10 }}>
      <canvas
        ref={canvasRef}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        style={{ width: '100%', aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}`, borderRadius: radii.md, background: colors.background }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => download('feed')} disabled={!ready} style={{ ...btn, background: colors.primary, color: '#fff', opacity: ready ? 1 : 0.5 }}>
          Descargar post
        </button>
        <button type="button" onClick={() => download('story')} disabled={!ready} style={{ ...btn, background: colors.primary, color: '#fff', opacity: ready ? 1 : 0.5 }}>
          Descargar historia
        </button>
        <button type="button" onClick={copy} style={{ ...btn, background: colors.primaryLight, color: colors.primaryDark }}>
          {copied ? '¡Copiado!' : 'Copiar texto'}
        </button>
      </div>
      {canPublish && (
        confirming ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
            <span style={{ flex: 1 }}>{confirming === 'story' ? '¿Publicar como historia?' : '¿Publicar en el feed?'}</span>
            <button type="button" onClick={() => publish(confirming)} disabled={publishing} style={{ ...btn, flex: 'none', background: colors.primary, color: '#fff' }}>
              {publishing ? 'Publicando…' : 'Sí, publicar'}
            </button>
            <button type="button" onClick={() => setConfirming(null)} disabled={publishing} style={{ ...btn, flex: 'none', background: colors.background, color: colors.navy }}>
              No
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            {(['feed', 'story'] as const).map(target => (
              <button
                key={target}
                type="button"
                onClick={() => setConfirming(target)}
                disabled={!ready || done(target)}
                style={{ ...btn, background: done(target) ? colors.background : 'linear-gradient(90deg, #833AB4, #E1306C, #F77737)', color: done(target) ? colors.navy400 : '#fff', opacity: ready ? 1 : 0.5 }}
              >
                {done(target) ? (target === 'story' ? 'Historia publicada hoy' : 'Publicado hoy') : target === 'story' ? '📱 Publicar historia' : '📸 Publicar post'}
              </button>
            ))}
          </div>
        )
      )}
      {result && (
        <div style={{ fontSize: 13, color: result.ok ? colors.primaryDark : colors.error }}>
          {result.text}{' '}
          {result.link && <a href={result.link} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontWeight: 700 }}>Ver publicación ↗</a>}
        </div>
      )}
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: fonts.body, fontSize: 12, color: colors.navy600, background: colors.background, borderRadius: radii.sm, padding: 10, maxHeight: 130, overflow: 'auto' }}>
        {text}
      </pre>
    </div>
  )
}

const btn: React.CSSProperties = {
  flex: 1, border: 'none', borderRadius: 10, padding: '10px 12px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: fonts.body,
}
