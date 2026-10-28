import type { Metadata } from 'next'
import { getProductBySlug } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import { bestPrice, storeCount } from '../../lib/insights'
import { getBestOffer } from '../../lib/offers'
import { SiteFooter, SiteHeader } from '../../lib/page'
import { Breadcrumb, h1Style, leadStyle, pageMain } from '../../lib/seoBlocks'
import { MAX_COMPARE, buildSpecRows } from '../../lib/specs'
import { colors, fonts } from '../../lib/tokens'
import { SITE_URL } from '../../lib/site'
import type { Product } from '../../lib/types'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ p?: string | string[] }> }

async function loadProducts(raw: string | string[] | undefined): Promise<Product[]> {
  const slugs = [...new Set((Array.isArray(raw) ? raw : raw ? [raw] : []).filter(Boolean))].slice(0, MAX_COMPARE)
  const products = await Promise.all(slugs.map(getProductBySlug))
  return products.filter((product): product is Product => product !== null)
}

// Every pair is a different URL, so none of them is indexed: the guides and
// product pages are the indexable content, this is a tool.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const products = await loadProducts((await searchParams).p)
  const title = products.length > 1 ? `${products.map(p => p.name).join(' vs ')} | DóndeTa` : 'Comparar productos | DóndeTa'
  return { title, robots: { index: false, follow: true } }
}

const cell = { padding: '10px 12px', fontFamily: fonts.body, fontSize: 13, color: colors.navy, borderBottom: `1px solid ${colors.border}`, verticalAlign: 'top' } as const
const labelCell = { ...cell, color: colors.navy400, fontWeight: 600, position: 'sticky', left: 0, background: colors.card, minWidth: 110 } as const

export default async function ComparePage({ searchParams }: Props) {
  const products = await loadProducts((await searchParams).p)

  if (products.length < 2) {
    return (
      <main style={pageMain}>
        <SiteHeader />
        <Breadcrumb items={[{ href: SITE_URL, label: 'DóndeTa' }, { label: 'Comparar' }]} />
        <h1 style={h1Style}>Comparar productos</h1>
        <p style={leadStyle}>
          Elige al menos dos productos desde su página (botón «Comparar con similares») para ver sus características
          y precios lado a lado.
        </p>
        <SiteFooter />
      </main>
    )
  }

  const rows = buildSpecRows(products)
  const best = products.map(bestPrice)
  const cheapest = Math.min(...best.filter((n): n is number => n !== undefined))

  return (
    <main style={{ ...pageMain, maxWidth: 980 }}>
      <SiteHeader />
      <Breadcrumb items={[{ href: SITE_URL, label: 'DóndeTa' }, { label: 'Comparar' }]} />
      <h1 style={h1Style}>{products.map(p => p.name).join(' vs ')}</h1>
      <p style={leadStyle}>
        Características según lo que publica cada tienda y el mejor precio de hoy. Las filas resaltadas son donde los
        productos se diferencian.
      </p>

      <div style={{ overflowX: 'auto', marginTop: 16, border: `1px solid ${colors.border}`, borderRadius: 16, background: colors.card }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 120 + products.length * 200 }}>
          <thead>
            <tr>
              <th style={labelCell} />
              {products.map(product => (
                <th key={product.id} style={{ ...cell, textAlign: 'left' }}>
                  {product.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.name} width={72} height={72} style={{ objectFit: 'contain', background: '#fff', borderRadius: 10, display: 'block', marginBottom: 8 }} />
                  )}
                  <a href={`/product/${product.slug}`} style={{ color: colors.navy, textDecoration: 'none', fontSize: 13.5 }}>{product.name}</a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={labelCell}>Mejor precio</td>
              {products.map((product, i) => {
                const offer = getBestOffer(product.prices)
                const isLowest = best[i] === cheapest && products.length > 1
                return (
                  <td key={product.id} style={cell}>
                    {best[i] === undefined ? '—' : (
                      <>
                        <b style={{ fontFamily: fonts.display, color: isLowest ? colors.primary : colors.navy }}>{formatPrice(best[i]!)}</b>
                        {offer && <div style={{ fontSize: 12, color: colors.navy400 }}>en {offer.store}</div>}
                      </>
                    )}
                  </td>
                )
              })}
            </tr>
            <tr>
              <td style={labelCell}>Tiendas</td>
              {products.map(product => <td key={product.id} style={cell}>{storeCount(product)}</td>)}
            </tr>
            {rows.map(row => (
              <tr key={row.label} style={row.differs ? { background: colors.primaryLight } : undefined}>
                <td style={{ ...labelCell, background: row.differs ? colors.primaryLight : colors.card }}>{row.label}</td>
                {row.values.map((value, i) => (
                  <td key={products[i].id} style={{ ...cell, color: value ? colors.navy : colors.navy200 }}>{value ?? 'No indicado'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!rows.length && (
        <p style={{ ...leadStyle, marginTop: 16 }}>Todavía no tenemos características publicadas para estos productos.</p>
      )}
      <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.navy200, marginTop: 16 }}>
        Las características las publican las tiendas; DóndeTa no las mide ni las puntúa. «No indicado» significa que la
        tienda no lo publica, no que el producto no lo tenga. Confirma los datos con la tienda antes de comprar.
      </p>
      <SiteFooter />
    </main>
  )
}
