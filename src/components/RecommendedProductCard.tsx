import ProductCard from './ProductCard'
import type { Product } from '../types'
import type { RankedProduct } from '../domain/recommendations'

interface Props {
  recommendation: RankedProduct
  onProduct: (product: Product) => void
  isFavorite: boolean
  onToggleFavorite: () => void
  onHide: () => void
}

export default function RecommendedProductCard({
  recommendation,
  onProduct,
  isFavorite,
  onToggleFavorite,
  onHide,
}: Props) {
  const { product, score, reasons } = recommendation

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        position: 'absolute', zIndex: 3, left: 8, bottom: 8,
        background: '#0F1D2D', color: '#fff', borderRadius: 999,
        padding: '4px 8px', fontSize: 10, fontWeight: 700,
        fontFamily: "'Poppins', sans-serif", pointerEvents: 'none',
        boxShadow: '0 2px 6px rgba(15,29,45,0.18)',
      }}>
        {score}% para ti
      </div>
      <ProductCard
        product={product}
        onProduct={onProduct}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />
      <div style={{ width: 180, paddingTop: 7 }}>
        <div style={{
          fontSize: 10, color: '#66788A', lineHeight: 1.3,
          fontFamily: "'DM Sans', sans-serif", minHeight: 26,
        }}>
          {reasons.slice(0, 2).join(' · ')}
        </div>
        <button
          type="button"
          onClick={onHide}
          style={{
            marginTop: 4, padding: 0, border: 0, background: 'transparent',
            color: '#9AAABB', fontSize: 10, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          No me interesa
        </button>
      </div>
    </div>
  )
}
