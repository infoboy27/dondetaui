import { useState } from 'react'
import { formatPrice } from '../data/mock'
import { BellIcon, HeartIcon, XIcon } from '../components/Icons'
import ProductImage from '../components/ProductImage'
import { useCatalogProducts } from '../hooks/useCatalogProducts'
import type { PriceAlert, Product } from '../types'

interface Props {
  onProduct: (p: Product) => void
  favoriteIds: Set<string>
  onToggleFavorite: (id: string) => void
  alerts: PriceAlert[]
  onRemoveAlert: (productId: string) => void
  initialTab?: 'alertas' | 'favoritos'
}

function AlertRow({ alert, onProduct, onRemove }: {
  alert: PriceAlert
  onProduct: (p: Product) => void
  onRemove: () => void
}) {
  const cheapest = alert.product.prices[0]

  return (
    <div
      onClick={() => onProduct(alert.product)}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #E8EDF2',
        boxShadow: '0 2px 8px rgba(15,29,45,0.04)',
        overflow: 'hidden',
        marginBottom: 12,
        display: 'flex', gap: 12, padding: '14px 16px',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 60, height: 60, borderRadius: 12,
        background: '#F8FAFC', flexShrink: 0, overflow: 'hidden',
        border: '1px solid #E8EDF2',
      }}>
        <ProductImage src={alert.product.image} alt={alert.product.name} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          color: '#0F1D2D', marginBottom: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {alert.product.name}
        </div>
        {cheapest && (
          <div style={{
            fontSize: 17, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            color: '#0F1D2D', letterSpacing: '-0.03em',
            marginBottom: 4,
          }}>
            {formatPrice(cheapest.price)}
          </div>
        )}
        <div style={{
          fontSize: 11, color: '#00B894', fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {alert.targetPrice != null
            ? `Te avisamos si baja a ${formatPrice(alert.targetPrice)}`
            : 'Te avisamos ante cualquier bajada'}
        </div>
      </div>
      <button
        type="button"
        aria-label={`Quitar alerta de ${alert.product.name}`}
        onClick={event => {
          event.stopPropagation()
          onRemove()
        }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, alignSelf: 'flex-start' }}
      >
        <XIcon size={18} color="#9AAABB" />
      </button>
    </div>
  )
}

function FavoriteCard({ product, onProduct, onToggleFavorite }: {
  product: Product
  onProduct: (p: Product) => void
  onToggleFavorite: () => void
}) {
  const cheapest = product.prices[0]
  const change = cheapest.price - product.previousPrice
  const pct = Math.round((Math.abs(change) / product.previousPrice) * 100)

  return (
    <div
      onClick={() => onProduct(product)}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #E8EDF2',
        boxShadow: '0 2px 8px rgba(15,29,45,0.04)',
        overflow: 'hidden',
        marginBottom: 12,
        display: 'flex', gap: 12, padding: '14px 16px',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 60, height: 60, borderRadius: 12,
        background: '#F8FAFC', flexShrink: 0, overflow: 'hidden',
        border: '1px solid #E8EDF2',
      }}>
        <ProductImage src={product.image} alt={product.name} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          color: '#0F1D2D', marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {product.name}
        </div>
        <div style={{
          fontSize: 11, color: '#9AAABB',
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 6,
        }}>
          Mejor precio en {cheapest.store}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 17, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            color: '#0F1D2D', letterSpacing: '-0.03em',
          }}>
            {formatPrice(cheapest.price)}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            color: change < 0 ? '#00B894' : '#FF3B3B',
            background: change < 0 ? '#E6F7F3' : '#FFF0F0',
            padding: '2px 6px', borderRadius: 999,
          }}>
            {change < 0 ? '↓' : '↑'}{pct}%
          </span>
        </div>
      </div>
      <button
        type="button"
        aria-label={`Quitar ${product.name} de favoritos`}
        onClick={event => {
          event.stopPropagation()
          onToggleFavorite()
        }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, alignSelf: 'flex-start' }}
      >
        <HeartIcon size={18} filled color="#FF9F1C" />
      </button>
    </div>
  )
}

export default function AlertsScreen({ onProduct, favoriteIds, onToggleFavorite, alerts, onRemoveAlert, initialTab }: Props) {
  const [tab, setTab] = useState<'alertas' | 'favoritos'>(initialTab ?? 'alertas')
  const { products: catalog } = useCatalogProducts()

  const favorites = catalog.filter(p => favoriteIds.has(p.id))

  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 20px 0',
        borderBottom: '1px solid #E8EDF2',
      }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700,
          fontFamily: "'Poppins', sans-serif",
          color: '#0F1D2D', margin: '0 0 16px',
          letterSpacing: '-0.03em',
        }}>
          {tab === 'alertas' ? 'Mis alertas' : 'Favoritos'}
        </h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {(['alertas', 'favoritos'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 0',
                border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: tab === t ? '2.5px solid #00B894' : '2.5px solid transparent',
                fontSize: 14, fontWeight: tab === t ? 700 : 400,
                fontFamily: "'Poppins', sans-serif",
                color: tab === t ? '#00B894' : '#9AAABB',
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >
              {t === 'alertas' ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <BellIcon size={15} color={tab === 'alertas' ? '#00B894' : '#9AAABB'} />
                  Alertas
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: tab === 'alertas' ? '#00B894' : '#E8EDF2',
                    color: tab === 'alertas' ? '#fff' : '#9AAABB',
                    padding: '1px 6px', borderRadius: 999,
                  }}>
                    {alerts.length}
                  </span>
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <HeartIcon size={15} color={tab === 'favoritos' ? '#FF9F1C' : '#9AAABB'} filled={tab === 'favoritos'} />
                  Favoritos
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {tab === 'alertas' ? (
          alerts.length > 0 ? (
            alerts.map(alert => (
              <AlertRow
                key={alert.productId}
                alert={alert}
                onProduct={onProduct}
                onRemove={() => onRemoveAlert(alert.productId)}
              />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#E6F7F3', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BellIcon size={32} color="#00B894" />
              </div>
              <h3 style={{
                fontSize: 16, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D', margin: '0 0 8px',
              }}>
                Todavía no has creado alertas
              </h3>
              <p style={{
                fontSize: 13, color: '#9AAABB',
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: '1.5',
              }}>
                Crea alertas de precio para que te avisemos cuando bajen los precios de tus productos favoritos.
              </p>
            </div>
          )
        ) : (
          favorites.length > 0 ? (
            favorites.map(p => (
              <FavoriteCard
                key={p.id}
                product={p}
                onProduct={onProduct}
                onToggleFavorite={() => onToggleFavorite(p.id)}
              />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#FFF3E0', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <HeartIcon size={32} color="#FF9F1C" />
              </div>
              <h3 style={{
                fontSize: 16, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D', margin: '0 0 8px',
              }}>
                Todavía no tienes favoritos
              </h3>
              <p style={{
                fontSize: 13, color: '#9AAABB',
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: '1.5',
              }}>
                Guarda productos que te interesen para seguir sus precios fácilmente.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
