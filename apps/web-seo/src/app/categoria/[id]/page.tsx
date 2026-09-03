import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllProducts } from '../../../lib/api'
import { SEO_CATEGORIES, matchesCategory } from '../../../lib/categories'
import { formatPrice } from '../../../lib/format'
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

function findCategory(id: string) {
  return SEO_CATEGORIES.find(c => c.id === id)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const category = findCategory(id)
  if (!category) return {}

  const title = `${category.label} — Compara precios | DóndeTa`
  const description = `Compara precios de ${category.label.toLowerCase()} entre Plaza Lama, Jumbo, Sirena, Corripio y PriceSmart en República Dominicana.`

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/categoria/${category.id}` },
  }
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params
  const category = findCategory(id)
  if (!category) notFound()

  const allProducts = await getAllProducts()
  const products = allProducts.filter(product => matchesCategory(product, category.id))

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 64px' }}>
      <a href={SITE_URL} style={{ fontSize: 13, color: colors.navy400, fontFamily: fonts.body, textDecoration: 'none' }}>
        ← DóndeTa
      </a>

      <h1 style={{ fontFamily: fonts.display, fontSize: 26, color: colors.navy, margin: '16px 0 4px' }}>
        {category.label}
      </h1>
      <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.navy400, margin: '0 0 24px' }}>
        {products.length} producto{products.length === 1 ? '' : 's'} comparados en DóndeTa
      </p>

      <section style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 16, marginBottom: 18 }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: 16, color: colors.navy, margin: '0 0 8px' }}>
          Que revisar en {category.label.toLowerCase()}
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 1.7, color: colors.navy400, margin: 0 }}>
          Usa esta categoria para ubicar precios publicados y comparar opciones disponibles. Antes de comprar, valida modelo exacto, garantia, entrega, instalacion y condiciones de la tienda. DóndeTa organiza datos de referencia; el precio final se confirma con el comercio.
        </p>
      </section>

      {products.map(product => {
        const offer = getBestOffer(product.prices)
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
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.navy400 }}>{product.brand}</div>
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
        Para entender como se ordenan ofertas y que limitaciones tienen los precios publicados, consulta la <a href="/metodologia" style={{ color: colors.primary }}>metodologia de DóndeTa</a>.
      </p>
    </main>
  )
}
