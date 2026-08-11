import { formatPrice } from '../data/mock'
import { ChevronLeft, TrendingDownIcon, CheckIcon, BellIcon } from '../components/Icons'
import ProductImage from '../components/ProductImage'
import { getPriceDropNotifications } from '../domain/notifications'
import { useCatalogProducts } from '../hooks/useCatalogProducts'
import type { Product } from '../types'

interface Props {
  alertedIds: Set<string>
  onBack: () => void
  onProduct: (p: Product) => void
}

export default function NotificationsScreen({ alertedIds, onBack, onProduct }: Props) {
  const { products } = useCatalogProducts()
  const notifications = getPriceDropNotifications(products, alertedIds)

  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #E8EDF2',
      }}>
        <button
          onClick={onBack}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#F2F4F7', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={18} color="#0F1D2D" />
        </button>
        <span style={{
          fontSize: 20, fontWeight: 700,
          fontFamily: "'Poppins', sans-serif",
          color: '#0F1D2D',
          letterSpacing: '-0.03em',
        }}>
          Notificaciones
        </span>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {notifications.length > 0 ? (
          notifications.map(n => {
            const savings = n.oldPrice - n.newPrice
            return (
              <div key={n.product.id} className="fade-in" style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #E8EDF2',
                boxShadow: '0 2px 8px rgba(15,29,45,0.04)',
                overflow: 'hidden',
                marginBottom: 12,
              }}>
                <div style={{
                  background: '#E6F7F3',
                  padding: '7px 16px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <TrendingDownIcon size={13} color="#00B894" />
                  <span style={{
                    fontSize: 11, color: '#00B894', fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    letterSpacing: '0.01em',
                  }}>
                    BAJÓ DE PRECIO · -{n.pct}%
                  </span>
                </div>

                <div
                  onClick={() => onProduct(n.product)}
                  style={{ display: 'flex', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                >
                  <div style={{
                    width: 60, height: 60, borderRadius: 12,
                    background: '#F8FAFC', flexShrink: 0, overflow: 'hidden',
                    border: '1px solid #E8EDF2',
                  }}>
                    <ProductImage src={n.product.image} alt={n.product.name} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#0F1D2D', marginBottom: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {n.product.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{
                        fontSize: 20, fontWeight: 700,
                        fontFamily: "'Poppins', sans-serif",
                        color: '#00B894', letterSpacing: '-0.03em',
                      }}>
                        {formatPrice(n.newPrice)}
                      </span>
                      <span style={{
                        fontSize: 12, color: '#9AAABB',
                        fontFamily: "'DM Sans', sans-serif",
                        textDecoration: 'line-through',
                      }}>
                        {formatPrice(n.oldPrice)}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11, color: '#FF9F1C', fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      Ahorras {formatPrice(savings)}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '0 16px 14px' }}>
                  <button
                    onClick={() => onProduct(n.product)}
                    style={{
                      width: '100%', padding: '10px 0',
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
          })
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
              Sin novedades por ahora
            </h3>
            <p style={{
              fontSize: 13, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: '1.5',
            }}>
              Te avisaremos aquí cuando baje el precio de un producto con alerta activa.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
