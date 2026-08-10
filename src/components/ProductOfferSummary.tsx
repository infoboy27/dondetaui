import { formatPrice } from '../domain/currency'
import { rankOffers } from '../domain/offers'
import { colors, fonts, radii } from '../design/tokens'
import type { StorePrice } from '../types'
import { ClockIcon, MapPinIcon, TruckIcon } from './Icons'

interface ProductOfferSummaryProps {
  offers: StorePrice[]
}

export default function ProductOfferSummary({ offers }: ProductOfferSummaryProps) {
  const rankedOffers = rankOffers(offers)
  const bestOffer = rankedOffers[0]
  const highestListPrice = rankedOffers.reduce((max, offer) => Math.max(max, offer.price), bestOffer?.price ?? 0)
  const savings = bestOffer ? Math.max(0, highestListPrice - bestOffer.price) : 0

  return (
    <div
      style={{
        background: colors.card,
        borderRadius: radii.lg,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 2px 8px rgba(15,29,45,0.04)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${colors.background}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: fonts.display, color: colors.navy }}>
          Resumen de precios
        </div>
        <div style={{ fontSize: 11, color: '#9AAABB', fontFamily: fonts.body, marginTop: 2 }}>
          {rankedOffers.length} tiendas comparadas
        </div>
      </div>

      {rankedOffers.length > 0 ? rankedOffers.map((offer, index) => (
        <div
          key={`${offer.store}-${offer.storeId ?? 'default'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: index === 0 ? colors.primaryLight : colors.card,
            borderBottom: index < rankedOffers.length - 1 ? `1px solid ${colors.background}` : 'none',
            borderLeft: index === 0 ? `3px solid ${colors.primary}` : '3px solid transparent',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: radii.sm,
              background: `${offer.color}18`,
              border: `1.5px solid ${offer.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 800, fontFamily: fonts.display, color: offer.color }}>
              {offer.abbr}
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: fonts.body, color: colors.navy }}>
                {offer.store}
              </span>
              {index === 0 && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: colors.card,
                    fontFamily: fonts.display,
                    background: colors.primary,
                    padding: '2px 6px',
                    borderRadius: radii.full,
                  }}
                >
                  MÁS BARATO
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <TruckIcon size={10} color="#9AAABB" />
                <span style={{ fontSize: 10, color: '#9AAABB', fontFamily: fonts.body }}>
                  {offer.shipping}
                </span>
              </div>
              {offer.distance && (
                <>
                  <span style={{ fontSize: 9, color: colors.navy100 }}>·</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPinIcon size={10} color="#9AAABB" />
                    <span style={{ fontSize: 10, color: '#9AAABB', fontFamily: fonts.body }}>
                      {offer.distance}
                    </span>
                  </div>
                </>
              )}
              {!offer.available && (
                <span style={{ fontSize: 9, color: colors.error, fontFamily: fonts.body }}>Sin stock</span>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                fontFamily: fonts.display,
                color: index === 0 ? colors.primary : colors.navy,
                letterSpacing: '-0.02em',
              }}
            >
              {formatPrice(offer.price)}
            </div>
            {index === 0 && savings > 0 && (
              <div style={{ fontSize: 10, color: colors.accent, fontWeight: 600, fontFamily: fonts.body }}>
                Ahorras {formatPrice(savings)}
              </div>
            )}
          </div>
        </div>
      )) : (
        <div style={{ padding: '20px 16px', fontSize: 12, color: '#9AAABB', fontFamily: fonts.body }}>
          No hay ofertas disponibles para este producto.
        </div>
      )}

      {bestOffer && (
        <div style={{ padding: '10px 16px', background: '#F8FAFC', borderTop: `1px solid ${colors.background}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClockIcon size={12} color="#9AAABB" />
            <span style={{ fontSize: 11, color: '#9AAABB', fontFamily: fonts.body }}>
              Actualizado hace {bestOffer.updated} · Disponibilidad puede variar
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
