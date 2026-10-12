import { colors, fonts, radii } from '../design/tokens'
import { formatPrice } from '../domain/currency'
import { getBestOffer } from '../domain/offers'
import type { Product } from '../types'
import ProductImage from './ProductImage'
import StoreLogo from './StoreLogo'

interface Props {
  product: Product
  onProduct: (product: Product) => void
  // The reason the card is on the home page: a saving between stores or a
  // recent price drop. Shown as the orange pill and the strikethrough price.
  highlight: { label: string; wasPrice?: number }
  storeCount?: number
  width?: number | string
  priority?: boolean
}

// Home-page card for "Comparaciones del día" / "Bajaron de precio": same
// card language as ProductCard, but it leads with why the product is worth
// a look (how much you save, in how many stores) and where it's cheapest.
export default function DealCard({ product, onProduct, highlight, storeCount, width = 200, priority = false }: Props) {
  const best = getBestOffer(product.prices)

  return (
    <button
      type="button"
      onClick={() => onProduct(product)}
      style={{
        background: colors.card,
        borderRadius: radii.lg,
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 2px 8px rgba(15,29,45,0.05)',
        cursor: 'pointer',
        width,
        flexShrink: 0,
        padding: 0,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
      }}
      onMouseEnter={event => {
        event.currentTarget.style.boxShadow = '0 6px 18px rgba(15,29,45,0.10)'
        event.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={event => {
        event.currentTarget.style.boxShadow = '0 2px 8px rgba(15,29,45,0.05)'
        event.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ position: 'relative', background: '#F8FAFC', height: 130, width: '100%' }}>
        <ProductImage src={product.image} alt={product.name} priority={priority} />
        <span style={{
          position: 'absolute', top: 8, left: 8,
          background: colors.accent, color: '#fff',
          fontSize: 11, fontWeight: 700, fontFamily: fonts.display,
          padding: '3px 8px', borderRadius: radii.full,
        }}>
          {highlight.label}
        </span>
      </div>

      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div style={{
          fontSize: 13, color: colors.navy, fontWeight: 500, fontFamily: fonts.body,
          lineHeight: '1.3', minHeight: 34,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {product.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: fonts.display, color: colors.primary, letterSpacing: '-0.03em' }}>
            {best ? formatPrice(best.price) : 'Sin precio'}
          </span>
          {highlight.wasPrice && best && highlight.wasPrice > best.price && (
            <span style={{ fontSize: 11, color: '#9AAABB', textDecoration: 'line-through', fontFamily: fonts.body }}>
              {formatPrice(Math.round(highlight.wasPrice))}
            </span>
          )}
        </div>
        {storeCount && storeCount > 1 && (
          <div style={{ fontSize: 11, color: colors.navy400, fontFamily: fonts.body }}>
            Comparado en {storeCount} tiendas
          </div>
        )}
        {best && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
            <StoreLogo store={best.store} abbr={best.abbr} color={best.color} size={20} borderRadius={6} />
            <span style={{ fontSize: 11, color: colors.navy400, fontFamily: fonts.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Más barato en {best.store}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}

// Same footprint as a DealCard, shown while the catalog loads so the home
// page doesn't jump when the real cards arrive (Lighthouse CLS was 0.81).
export function DealCardSkeleton({ width = 200 }: { width?: number | string }) {
  return (
    <div aria-hidden="true" style={{
      background: colors.card, borderRadius: radii.lg, border: `1px solid ${colors.border}`,
      width, height: 248, flexShrink: 0, overflow: 'hidden',
    }}>
      <div style={{ height: 130, background: '#F8FAFC' }} />
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 12, width: '90%', borderRadius: 6, background: colors.border }} />
        <div style={{ height: 12, width: '60%', borderRadius: 6, background: colors.border }} />
        <div style={{ height: 18, width: '50%', borderRadius: 6, background: colors.border, marginTop: 4 }} />
      </div>
    </div>
  )
}
