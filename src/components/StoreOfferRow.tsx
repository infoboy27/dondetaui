import { formatPrice } from '../data/mock'
import { colors, fonts, radii } from '../design/tokens'
import type { StorePrice } from '../types'
import { ClockIcon, TruckIcon } from './Icons'

interface StoreOfferRowProps {
  offer: StorePrice
  isBest: boolean
  savings: number
}

export default function StoreOfferRow({ offer, isBest, savings }: StoreOfferRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        background: isBest ? colors.primaryLight : colors.card,
        borderBottom: `1px solid ${colors.background}`,
        borderLeft: isBest ? `3px solid ${colors.primary}` : '3px solid transparent',
        transition: 'background 0.12s',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: `${offer.color}18`,
          border: `1.5px solid ${offer.color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            fontFamily: fonts.display,
            color: offer.color,
          }}
        >
          {offer.abbr}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              fontFamily: fonts.body,
              color: colors.navy,
            }}
          >
            {offer.store}
          </span>
          {isBest && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: colors.card,
                fontFamily: fonts.display,
                background: colors.primary,
                padding: '2px 6px',
                borderRadius: radii.full,
                letterSpacing: '0.03em',
              }}
            >
              MÁS BARATO
            </span>
          )}
          {!offer.available && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: colors.error,
                fontFamily: fonts.body,
                background: '#FFF0F0',
                padding: '2px 6px',
                borderRadius: radii.full,
              }}
            >
              Sin stock
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <TruckIcon size={11} color="#9AAABB" />
            <span style={{ fontSize: 11, color: '#9AAABB', fontFamily: fonts.body }}>
              {offer.shipping}
            </span>
          </div>
          <span style={{ fontSize: 9, color: colors.navy100 }}>·</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <ClockIcon size={11} color="#9AAABB" />
            <span style={{ fontSize: 11, color: '#9AAABB', fontFamily: fonts.body }}>
              Hace {offer.updated}
            </span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            fontFamily: fonts.display,
            color: isBest ? colors.primary : colors.navy,
            letterSpacing: '-0.02em',
          }}
        >
          {formatPrice(offer.price)}
        </div>
        {isBest && savings > 0 && (
          <div style={{ fontSize: 10, color: colors.accent, fontWeight: 600, fontFamily: fonts.body }}>
            Ahorras {formatPrice(savings)}
          </div>
        )}
      </div>
    </div>
  )
}
