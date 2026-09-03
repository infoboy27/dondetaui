import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllProducts } from '../../../lib/api'
import { SEO_CATEGORIES, matchesCategory } from '../../../lib/categories'
import { formatPrice } from '../../../lib/format'
import { analyzeHistory } from '../../../lib/history'
import { getBestOffer } from '../../../lib/offers'
import { colors, fonts } from '../../../lib/tokens'
import { SITE_URL } from '../../../lib/site'

interface Props {
  params: Promise<{ id: string }>
}

// Server-rendered, same reasoning as the store pages -- and, like SITE_URL
// resolving correctly, needs force-dynamic since this has no data
// dependency Next.js would otherwise treat as a signal to pre-render once
// at build time (see the robots.ts/privacy page fix from the same root
// cause). Only the 4 curated categories with real inventory get pages
// (see lib/categories.ts) -- Hogar/Muebles return notFound() below rather
// than a page that's permanently empty.
export const dynamic = 'force-dynamic'

// One line of category-specific context so each page has some unique prose
// above the product list.
const CATEGORY_INTRO: Record<string, string> = {
  electrodomesticos:
    'Neveras, lavadoras, secadoras y línea blanca en general. En esta categoría el costo total —envío, instalación y retiro del equipo viejo— suele pesar tanto como el precio de lista, y conviene comparar capacidad y consumo antes que marca.',
  aires:
    'Aires acondicionados y ventilación. Antes de mirar el precio, define los BTU según el tamaño y el uso del espacio, y ten en cuenta que la instalación de un split casi siempre tiene costo aparte.',
  cocina:
    'Estufas, hornos, microondas y pequeños electrodomésticos de cocina. Revisa medidas para el hueco disponible, tipo de energía (gas o eléctrica) y, en estufas de gas, que tengan dispositivo de seguridad por falla de llama.',
  'tv-audio':
    'Televisores y equipos de audio. La pulgada adecuada depende de la distancia de visión, y a igual resolución lo que más cambia la imagen es el tipo de panel y el manejo del brillo.',
}

function findCategory(id: string) {
  return SEO_CATEGORIES.find(c => c.id === id)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const category = findCategory(id)
  if (!category) return {}

  const products = (await getAllProducts()).filter(p => matchesCategory(p, category.id))
  const title = `${category.label} — precios e historial | DóndeTa`
  const description = `Precios publicados e historial de ${category.label.toLowerCase()} en tiendas de República Dominicana. ${products.length} productos monitoreados en DóndeTa.`

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/categoria/${category.id}` },
    // A category with no inventory yet shouldn't be indexed as an empty page.
    ...(products.length === 0 && { robots: { index: false, follow: true } }),
  }
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params
  const category = findCategory(id)
  if (!category) notFound()

  const allProducts = await getAllProducts()
  const products = allProducts
    .filter(product => matchesCategory(product, category.id))
    .sort((a, b) => (getBestOffer(a.prices)?.price ?? 0) - (getBestOffer(b.prices)?.price ?? 0))

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 64px' }}>
      <nav style={{ fontFamily: fonts.body, fontSize: 13, color: colors.navy400 }}>
        <a href={SITE_URL} style={{ color: colors.navy400, textDecoration: 'none' }}>DóndeTa</a>
        {' / '}
        <a href="/guias" style={{ color: colors.navy400, textDecoration: 'none' }}>Guías</a>
      </nav>

      <h1 style={{ fontFamily: fonts.display, fontSize: 26, color: colors.navy, margin: '16px 0 4px' }}>
        {category.label}
      </h1>
      <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.navy400, margin: '0 0 24px' }}>
        {products.length} producto{products.length === 1 ? '' : 's'} monitoreado{products.length === 1 ? '' : 's'} en DóndeTa
      </p>

      <section style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 16, marginBottom: 18 }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: 16, color: colors.navy, margin: '0 0 8px' }}>
          Qué revisar en {category.label.toLowerCase()}
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 1.7, color: colors.navy400, margin: 0 }}>
          {CATEGORY_INTRO[category.id] ??
            'Usa esta categoría para ubicar precios publicados y su historial. Antes de comprar, valida el modelo exacto, la garantía, la entrega, la instalación y las condiciones de la tienda.'}
        </p>
      </section>

      {products.length === 0 && (
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.navy400 }}>
          Todavía no tenemos productos de esta categoría en el catálogo.
        </p>
      )}

      {products.map(product => {
        const offer = getBestOffer(product.prices)
        const stats = analyzeHistory(product.priceHistory, offer?.price)
        return (
          <a
            key={product.id}
            href={`/product/${product.slug}`}
            style={{
              display: 'flex', gap: 14, alignItems: 'center',
              padding: '14px 16px', marginBottom: 10,
              background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14,
              textDecoration: 'none',
            }}
          >
            {product.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                width={56}
                height={56}
                style={{ borderRadius: 10, objectFit: 'cover', background: colors.background, flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.name}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.navy400 }}>
                {product.brand}
                {stats ? ` · ${stats.count} mediciones` : ''}
              </div>
            </div>
            {offer && (
              <div style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 700, color: colors.primary, flexShrink: 0 }}>
                {formatPrice(offer.price)}
              </div>
            )}
          </a>
        )
      })}

      <p style={{ marginTop: 20, fontFamily: fonts.body, fontSize: 13, lineHeight: 1.7, color: colors.navy400 }}>
        Para entender cómo se ordenan las ofertas y qué limitaciones tienen los precios publicados, consulta la{' '}
        <a href="/metodologia" style={{ color: colors.primary }}>metodología de DóndeTa</a>.
      </p>
    </main>
  )
}
