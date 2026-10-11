import type { ReactNode } from 'react'
import { formatPrice } from './format'
import { bestPrice, storeCount, type Comparison, type PriceDrop } from './insights'
import { getBestOffer } from './offers'
import { colors, fonts } from './tokens'
import type { Product } from './types'

// Building blocks for the data-driven landing pages (/precios, /comparaciones,
// /bajas-de-precio). Same visual language as the category and store pages.

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 26 }}>
      <h2 style={{ fontFamily: fonts.display, fontSize: 18, color: colors.navy, margin: '0 0 4px' }}>{title}</h2>
      {subtitle && <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.navy400, margin: '0 0 12px' }}>{subtitle}</p>}
      {children}
    </section>
  )
}

function Row({ product, right, sub }: { product: Product; right: ReactNode; sub: ReactNode }) {
  return (
    <a
      href={`/product/${product.slug}`}
      style={{
        display: 'flex', gap: 14, alignItems: 'center', padding: '12px 14px', marginBottom: 8,
        background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14, textDecoration: 'none',
      }}
    >
      {product.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image} alt={product.name} width={52} height={52} loading="lazy"
          style={{ borderRadius: 10, objectFit: 'contain', background: '#fff', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: fonts.body, fontSize: 13.5, fontWeight: 600, color: colors.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.navy400 }}>{sub}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>{right}</div>
    </a>
  )
}

const priceStyle = { fontFamily: fonts.display, fontSize: 15, fontWeight: 700, color: colors.primary }
const pillStyle = { fontFamily: fonts.body, fontSize: 11.5, fontWeight: 700, color: colors.accent }

export function ComparisonList({ items }: { items: Comparison[] }) {
  return (
    <>
      {items.map(item => (
        <Row
          key={item.product.id}
          product={item.product}
          sub={`${storeCount(item.product)} tiendas · más barato en ${item.cheapest}`}
          right={<><div style={priceStyle}>{formatPrice(bestPrice(item.product) ?? 0)}</div><div style={pillStyle}>Ahorras {formatPrice(item.savings)}</div></>}
        />
      ))}
    </>
  )
}

export function DropList({ items }: { items: PriceDrop[] }) {
  return (
    <>
      {items.map(item => (
        <Row
          key={item.product.id}
          product={item.product}
          sub={`antes ${formatPrice(Math.round(item.oldPrice))} · ${getBestOffer(item.product.prices)?.store ?? ''}`}
          right={<><div style={priceStyle}>{formatPrice(Math.round(item.newPrice))}</div><div style={pillStyle}>Bajó {item.pct}%</div></>}
        />
      ))}
    </>
  )
}

export function ProductList({ products }: { products: Product[] }) {
  return (
    <>
      {products.map(product => {
        const offer = getBestOffer(product.prices)
        const stores = storeCount(product)
        return (
          <Row
            key={product.id}
            product={product}
            sub={`${product.brand}${offer ? ` · ${stores > 1 ? `más barato en ${offer.store}` : offer.store}` : ''}`}
            right={<div style={priceStyle}>{formatPrice(bestPrice(product) ?? 0)}</div>}
          />
        )
      })}
    </>
  )
}

export interface Faq {
  q: string
  a: string
}

// Visible Q&A plus the matching FAQPage JSON-LD.
export function FaqBlock({ items }: { items: Faq[] }) {
  if (!items.length) return null
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
  }
  return (
    <Section title="Preguntas frecuentes">
      {items.map(item => (
        <details key={item.q} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
          <summary style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: colors.navy, cursor: 'pointer' }}>{item.q}</summary>
          <p style={{ fontFamily: fonts.body, fontSize: 13.5, lineHeight: 1.65, color: colors.navy400, margin: '8px 0 0' }}>{item.a}</p>
        </details>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </Section>
  )
}

export function Breadcrumb({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav style={{ fontFamily: fonts.body, fontSize: 13, color: colors.navy400 }}>
      {items.map((item, i) => (
        <span key={item.label}>
          {i > 0 && ' / '}
          {item.href ? <a href={item.href} style={{ color: colors.navy400, textDecoration: 'none' }}>{item.label}</a> : item.label}
        </span>
      ))}
    </nav>
  )
}

export const pageMain = { maxWidth: 760, margin: '0 auto', padding: '24px 20px 64px' } as const
export const h1Style = { fontFamily: fonts.display, fontSize: 28, lineHeight: 1.15, color: colors.navy, margin: '16px 0 8px' } as const
export const leadStyle = { fontFamily: fonts.body, fontSize: 15, lineHeight: 1.7, color: colors.navy400, margin: '0 0 8px' } as const
