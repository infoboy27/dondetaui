import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getToken } from '../../auth/session'
import { productsApi } from '../../api/products'
import { appConfig } from '../../config/env'
import { colors, fonts, radii } from '../../design/tokens'
import { getTopPriceDrops } from '../../domain/notifications'
import { getTopComparisons } from '../../domain/offers'
import type { Product } from '../../types'
import { CARD_HEIGHT, CARD_WIDTH, caption, drawCard, ensureFonts, type CardKind } from './instagramCard'

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

  useEffect(() => {
    productsApi.list().then(setProducts).catch(err => setError(err instanceof Error ? err.message : String(err)))
  }, [])

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
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 16px 60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 18 }}>
        {error && <div>No se pudo cargar el catálogo: {error}</div>}
        {!products && !error && <div>Cargando…</div>}
        {products && !items.length && <div>Hoy no hay comparaciones ni bajas de precio para publicar.</div>}
        {items.map(item => <CardPreview key={`${item.kind.type}-${item.product.id}`} item={item} />)}
      </main>
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

function CardPreview({ item }: { item: Item }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [copied, setCopied] = useState(false)
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

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    const slug = (item.product.slug || item.product.id).slice(0, 60)
    link.download = `dondeta-${item.kind.type === 'comparison' ? 'comparacion' : 'baja'}-${slug}.png`
    link.href = canvas.toDataURL('image/png')
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
        <button type="button" onClick={download} disabled={!ready} style={{ ...btn, background: colors.primary, color: '#fff', opacity: ready ? 1 : 0.5 }}>
          Descargar PNG
        </button>
        <button type="button" onClick={copy} style={{ ...btn, background: colors.primaryLight, color: colors.primaryDark }}>
          {copied ? '¡Copiado!' : 'Copiar texto'}
        </button>
      </div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: fonts.body, fontSize: 12, color: colors.navy600, background: colors.background, borderRadius: radii.sm, padding: 10, maxHeight: 130, overflow: 'auto' }}>
        {text}
      </pre>
    </div>
  )
}

const btn: React.CSSProperties = {
  flex: 1, border: 'none', borderRadius: 10, padding: '10px 12px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: fonts.body,
}
