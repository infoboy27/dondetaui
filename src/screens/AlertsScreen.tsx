import { useState } from 'react'
import { PRODUCTS, formatPrice } from '../data/mock'
import { BellIcon, HeartIcon, TrendingDownIcon, CheckIcon, XIcon } from '../components/Icons'
import { useCatalogProducts } from '../hooks/useCatalogProducts'
import type { Product } from '../types'

interface Props {
  onProduct: (p: Product) => void
  favoriteIds: Set<string>
  onToggleFavorite: (id: string) => void
  initialTab?: 'alertas' | 'favoritos'
}

const ALERTS = [
  {
    product: PRODUCTS[0],
    oldPrice: 25995,
    newPrice: 24495,
    store: 'Plaza Lama',
    time: 'Hace 2 horas',
    type: 'drop' as const,
  },
  {
    product: PRODUCTS[2],
    oldPrice: 31995,
    newPrice: 28995,
    store: 'Corripio',
    time: 'Hace 5 horas',
    type: 'drop' as const,
  },
  {
    product: PRODUCTS[1],
    oldPrice: 34995,
    newPrice: 32995,
    store: 'Jumbo',
    time: 'Ayer',
    type: 'drop' as const,
  },
]

function AlertCard({ alert, onProduct }: { alert: typeof ALERTS[0]; onProduct: (p: Product) => void }) {
  const [dismissed, setDismissed] = useState(false)
  const savings = alert.oldPrice - alert.newPrice
  const pct = Math.round((savings / alert.oldPrice) * 100)

  if (dismissed) return null

  return (
    <div className="fade-in" style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #E8EDF2',
      boxShadow: '0 2px 8px rgba(15,29,45,0.04)',
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      {/* Alert type label */}
      <div style={{
        background: '#E6F7F3',
        padding: '7px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingDownIcon size={13} color="#00B894" />
          <span style={{
            fontSize: 11, color: '#00B894', fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            letterSpacing: '0.01em',
          }}>
            BAJÓ DE PRECIO · -{pct}%
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, color: '#9AAABB',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {alert.time}
          </span>
          <button
            onClick={() => setDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
          >
            <XIcon size={14} color="#9AAABB" />
          </button>
        </div>
      </div>

      {/* Product info */}
      <div
        onClick={() => onProduct(alert.product)}
        style={{
          display: 'flex', gap: 12, padding: '14px 16px', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 60, height: 60, borderRadius: 12,
          background: '#F8FAFC', flexShrink: 0, overflow: 'hidden',
          border: '1px solid #E8EDF2',
        }}>
          <img src={alert.product.image} alt={alert.product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 20, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: '#00B894', letterSpacing: '-0.03em',
            }}>
              {formatPrice(alert.newPrice)}
            </span>
            <span style={{
              fontSize: 12, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif",
              textDecoration: 'line-through',
            }}>
              {formatPrice(alert.oldPrice)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 11, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {alert.store}
            </span>
            <span style={{ fontSize: 9, color: '#D8E6F0' }}>·</span>
            <span style={{
              fontSize: 11, color: '#FF9F1C', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Ahorras {formatPrice(savings)}
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => onProduct(alert.product)}
          style={{
            flex: 1, padding: '10px 0',
            border: 'none', borderRadius: 10,
            background: '#00B894', color: '#fff',
            fontSize: 13, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <CheckIcon size={14} color="#fff" />
          Ver oferta
        </button>
      </div>
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
        <img src={product.image} alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

export default function AlertsScreen({ onProduct, favoriteIds, onToggleFavorite, initialTab }: Props) {
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
                    {ALERTS.length}
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
          ALERTS.length > 0 ? (
            ALERTS.map((a, i) => (
              <AlertCard key={i} alert={a} onProduct={onProduct} />
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
