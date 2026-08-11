import { useState } from 'react'
import { formatPrice } from '../domain/currency'
import { getBestOffer } from '../domain/offers'
import { colors, fonts, radii } from '../design/tokens'
import type { Product } from '../types'
import { HeartIcon } from './Icons'

interface ProductCardProps {
  product: Product
  onProduct: (product: Product) => void
}

function DiscountBadge({ pct }: { pct: number }) {
  if (pct <= 0) return null
  return (
    <span
      style={{
        background: colors.accent,
        color: colors.card,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: fonts.display,
        padding: '2px 7px',
        borderRadius: radii.full,
        letterSpacing: '-0.01em',
      }}
    >
      -{pct}%
    </span>
  )
}

export default function ProductCard({ product, onProduct }: ProductCardProps) {
  const [fav, setFav] = useState(product.favorite ?? false)
  const bestOffer = getBestOffer(product.prices)

  return (
    <div
      onClick={() => onProduct(product)}
      style={{
        background: colors.card,
        borderRadius: radii.lg,
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 2px 8px rgba(15,29,45,0.05)',
        cursor: 'pointer',
        width: 180,
        flexShrink: 0,
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
      <div style={{ position: 'relative', background: '#F8FAFC', height: 140 }}>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <DiscountBadge pct={product.discount} />
        </div>
        <button
          type="button"
          aria-label={fav ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
          aria-pressed={fav}
          onClick={event => {
            event.stopPropagation()
            setFav(value => !value)
          }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
        >
          <HeartIcon size={15} filled={fav} />
        </button>
      </div>

      <div style={{ padding: '10px 12px 12px' }}>
        <div
          style={{
            fontSize: 12,
            color: '#9AAABB',
            fontWeight: 500,
            fontFamily: fonts.body,
            marginBottom: 2,
          }}
        >
          {bestOffer?.store ?? 'Precio no disponible'}
        </div>
        <div
          style={{
            fontSize: 13,
            color: colors.navy,
            fontWeight: 500,
            fontFamily: fonts.body,
            lineHeight: '1.3',
            marginBottom: 8,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: fonts.display,
            color: colors.navy,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {bestOffer ? formatPrice(bestOffer.price) : 'Sin precio'}
        </div>
        {bestOffer && product.previousPrice > bestOffer.price && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span
              style={{
                fontSize: 11,
                color: '#9AAABB',
                fontFamily: fonts.body,
                textDecoration: 'line-through',
              }}
            >
              {formatPrice(product.previousPrice)}
            </span>
            <span
              style={{
                fontSize: 11,
                color: colors.primary,
                fontWeight: 600,
                fontFamily: fonts.body,
              }}
            >
              Ahorras {formatPrice(Math.max(0, product.previousPrice - bestOffer.price))}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
