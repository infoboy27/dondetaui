import { useState } from 'react'
import { formatPrice } from '../domain/currency'
import { rankOffers } from '../domain/offers'
import { colors, fonts, radii } from '../design/tokens'
import type { Product } from '../types'
import { CheckIcon, ChevronDown, HeartIcon } from './Icons'
import ProductImage from './ProductImage'
import StoreOfferRow from './StoreOfferRow'

interface ProductComparisonCardProps {
  product: Product
  onProduct: (product: Product) => void
  isFavorite: boolean
  onToggleFavorite: () => void
}

export default function ProductComparisonCard({ product, onProduct, isFavorite, onToggleFavorite }: ProductComparisonCardProps) {
  const [expanded, setExpanded] = useState(false)
  const rankedOffers = rankOffers(product.prices)
  const bestOffer = rankedOffers[0]
  const highestListPrice = rankedOffers.reduce((max, offer) => Math.max(max, offer.price), bestOffer?.price ?? 0)
  const savings = bestOffer ? Math.max(0, highestListPrice - bestOffer.price) : 0
  const displayPrices = expanded ? rankedOffers : rankedOffers.slice(0, 3)

  return (
    <div
      style={{
        background: colors.card,
        borderRadius: radii.lg,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 2px 8px rgba(15,29,45,0.04)',
        overflow: 'hidden',
        marginBottom: 14,
      }}
    >
      <div
        style={{ display: 'flex', gap: 12, padding: '14px 14px 12px', cursor: 'pointer' }}
        onClick={() => onProduct(product)}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: radii.md,
            background: '#F8FAFC',
            flexShrink: 0,
            overflow: 'hidden',
            border: `1px solid ${colors.border}`,
          }}
        >
          <ProductImage src={product.image} alt={product.name} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              color: '#9AAABB',
              fontWeight: 500,
              fontFamily: fonts.body,
              marginBottom: 2,
            }}
          >
            {product.brand} · {product.model}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: fonts.body,
              color: colors.navy,
              marginBottom: 4,
              lineHeight: '1.3',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {product.subtitle}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#9AAABB', fontFamily: fonts.body }}>Desde</span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: fonts.display,
                color: colors.primary,
                letterSpacing: '-0.03em',
              }}
            >
              {bestOffer ? formatPrice(bestOffer.price) : 'Sin precio'}
            </span>
          </div>
          <div style={{ fontSize: 11, color: colors.accent, fontWeight: 600, fontFamily: fonts.body }}>
            Ahorras hasta {formatPrice(savings)} vs tienda más cara
          </div>
        </div>

        <button
          type="button"
          aria-label={isFavorite ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
          aria-pressed={isFavorite}
          onClick={event => {
            event.stopPropagation()
            onToggleFavorite()
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            alignSelf: 'flex-start',
            padding: 4,
          }}
        >
          <HeartIcon size={18} filled={isFavorite} />
        </button>
      </div>

      <div style={{ borderTop: `1px solid ${colors.background}` }}>
        {displayPrices.map((offer, index) => (
          <StoreOfferRow key={`${offer.store}-${offer.storeId ?? 'default'}`} offer={offer} isBest={index === 0} savings={savings} />
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px',
          borderTop: `1px solid ${colors.background}`,
          gap: 8,
        }}
      >
        {rankedOffers.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            aria-expanded={expanded}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: '#9AAABB',
              fontFamily: fonts.body,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            >
              <ChevronDown size={14} color="#9AAABB" />
            </span>
            {expanded ? 'Ver menos' : `${rankedOffers.length - 3} tiendas más`}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => onProduct(product)}
          disabled={!bestOffer}
          style={{
            background: bestOffer ? colors.primary : colors.border,
            color: bestOffer ? colors.card : '#9AAABB',
            border: 'none',
            borderRadius: 10,
            cursor: bestOffer ? 'pointer' : 'not-allowed',
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: fonts.display,
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CheckIcon size={14} color={bestOffer ? '#fff' : '#9AAABB'} />
          Ver oferta
        </button>
      </div>
    </div>
  )
}
