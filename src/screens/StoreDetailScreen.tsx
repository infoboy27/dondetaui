import { formatPrice } from '../data/mock'
import { useStoreDetail } from '../hooks/useStoreDetail'
import { ChevronLeft, HeartIcon } from '../components/Icons'

// PhoneIcon not in set — use a simple inline version
function Globe({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  )
}

function ExternalLink({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  )
}

interface Props {
  storeAbbr: string | null
  onBack: () => void
  onProduct: (p: any) => void
}

export default function StoreDetailScreen({ storeAbbr, onBack, onProduct }: Props) {
  const { store, products: storeProducts, loading } = useStoreDetail(storeAbbr)

  if (loading) {
    return (
      <div style={{
        background: '#F2F4F7', minHeight: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 13, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif" }}>
          Cargando tienda…
        </span>
      </div>
    )
  }

  if (!store) {
    return (
      <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' }}>
          <button
            onClick={onBack}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronLeft size={18} color="#0F1D2D" />
          </button>
        </div>
        <div style={{ padding: '0 20px', textAlign: 'center', marginTop: 40 }}>
          <span style={{ fontSize: 14, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif" }}>
            No pudimos encontrar esta tienda.
          </span>
        </div>
      </div>
    )
  }

  const storeName = store.name
  const storeColor = store.color
  const storeAbbrLabel = store.abbr

  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #E8EDF2',
      }}>
        {/* Back bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 0' }}>
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
            fontSize: 15, fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
            color: '#0F1D2D',
          }}>
            Detalle de tienda
          </span>
        </div>

        {/* Store hero */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            {/* Store logo */}
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: storeColor + '14',
              border: `2px solid ${storeColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 28, fontWeight: 900,
                fontFamily: "'Poppins', sans-serif",
                color: storeColor,
              }}>
                {storeAbbrLabel}
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: 22, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D', margin: '0 0 4px',
                letterSpacing: '-0.03em',
              }}>
                {storeName}
              </h1>
              <span style={{ fontSize: 11, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif" }}>
                {store.productCount} productos
              </span>
            </div>
          </div>

          {/* Quick info pills */}
          {store.websiteUrl && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#F2F4F7', borderRadius: 999,
                padding: '6px 12px',
              }}>
                <Globe size={13} color="#5d7ea0" />
                <span style={{
                  fontSize: 12, color: '#5d7ea0',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {new URL(store.websiteUrl).hostname.replace(/^www\./, '')}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {store.websiteUrl && (
            <div style={{ display: 'flex', gap: 8, paddingBottom: 16 }}>
              <button
                onClick={() => window.open(store.websiteUrl!, '_blank', 'noopener,noreferrer')}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 0', border: 'none', borderRadius: 12,
                  background: '#00B894', color: '#fff', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
                  boxShadow: '0 4px 12px rgba(0,184,148,0.25)',
                }}
              >
                <ExternalLink size={14} color="#fff" />
                Ir a la tienda
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Current deals header */}
        <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 12,
            }}>
              <span style={{
                fontSize: 15, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D',
              }}>
                Ofertas actuales
              </span>
              <span style={{
                fontSize: 11, color: '#9AAABB',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {storeProducts.length} productos
              </span>
            </div>

            {storeProducts.map(product => {
              const sp = product.prices.find(p => p.store === storeName) ?? product.prices[0]
              const isCheapest = product.prices[0].store === storeName

              return (
                <div
                  key={product.id}
                  onClick={() => onProduct(product)}
                  style={{
                    background: '#fff', borderRadius: 16,
                    border: `1px solid ${isCheapest ? '#00B89430' : '#E8EDF2'}`,
                    marginBottom: 12, overflow: 'hidden',
                    display: 'flex', gap: 12, padding: '12px 14px',
                    cursor: 'pointer',
                    boxShadow: isCheapest ? '0 2px 12px rgba(0,184,148,0.08)' : '0 1px 4px rgba(15,29,45,0.04)',
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
                      fontSize: 13, fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      color: '#0F1D2D', marginBottom: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {product.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: 17, fontWeight: 700,
                        fontFamily: "'Poppins', sans-serif",
                        color: isCheapest ? '#00B894' : '#0F1D2D',
                        letterSpacing: '-0.03em',
                      }}>
                        {formatPrice(sp.price)}
                      </span>
                      {isCheapest && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: '#fff',
                          fontFamily: "'Poppins', sans-serif",
                          background: '#00B894', padding: '2px 6px', borderRadius: 999,
                        }}>
                          MÁS BARATO
                        </span>
                      )}
                    </div>
                    {product.discount > 0 && product.previousPrice > sp.price && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{
                          fontSize: 11, color: '#9AAABB',
                          fontFamily: "'DM Sans', sans-serif",
                          textDecoration: 'line-through',
                        }}>
                          {formatPrice(product.previousPrice)}
                        </span>
                        <span style={{
                          fontSize: 11, color: '#FF9F1C', fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                          background: '#FFF3E0', padding: '1px 6px', borderRadius: 999,
                        }}>
                          -{product.discount}%
                        </span>
                      </div>
                    )}
                  </div>
                  <HeartIcon size={16} color="#D8E6F0" />
                </div>
              )
            })}
      </div>
    </div>
  )
}
