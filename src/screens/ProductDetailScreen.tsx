import { useState } from 'react'
import PriceHistoryChart from '../components/PriceHistoryChart'
import ProductOfferSummary from '../components/ProductOfferSummary'
import {
  BellIcon,
  CheckIcon,
  ChevronLeft,
  HeartIcon,
  ShareIcon,
  StarIcon,
  TrendingDownIcon,
} from '../components/Icons'
import { formatPrice } from '../data/mock'
import { getBestOffer } from '../domain/offers'
import type { Product } from '../types'

interface Props {
  product: Product
  onBack: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
  onCreateAlert: (targetPrice?: number) => Promise<void>
  isLoggedIn: boolean
  onRequireLogin: () => void
}

const PERIODS = ['7D', '30D', '90D', '6M', '1A']

export default function ProductDetailScreen({
  product, onBack, isFavorite, onToggleFavorite, onCreateAlert, isLoggedIn, onRequireLogin,
}: Props) {
  const [period, setPeriod] = useState('30D')
  const [showAlertSheet, setShowAlertSheet] = useState(false)
  const [alertPrice, setAlertPrice] = useState('')
  const [alertCreated, setAlertCreated] = useState(false)
  const [creatingAlert, setCreatingAlert] = useState(false)
  const [alertError, setAlertError] = useState<string | null>(null)

  const bestOffer = getBestOffer(product.prices)
  const priceMin = product.priceHistory.length
    ? Math.min(...product.priceHistory.map(point => point.price))
    : undefined
  const isBestPrice = Boolean(bestOffer && priceMin !== undefined && bestOffer.price <= priceMin * 1.05)

  const createAlert = async () => {
    if (!bestOffer) return

    const targetPrice = alertPrice.trim() ? Number(alertPrice) : undefined
    setCreatingAlert(true)
    setAlertError(null)
    try {
      await onCreateAlert(targetPrice)
      setAlertCreated(true)
      setTimeout(() => {
        setShowAlertSheet(false)
        setAlertCreated(false)
      }, 2000)
    } catch (error) {
      setAlertError(error instanceof Error ? error.message : 'No se pudo crear la alerta')
    } finally {
      setCreatingAlert(false)
    }
  }

  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #E8EDF2',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#F2F4F7', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={18} color="#0F1D2D" />
        </button>
        <span style={{
          flex: 1, fontSize: 15, fontWeight: 600,
          fontFamily: "'Poppins', sans-serif",
          color: '#0F1D2D',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {product.subtitle}
        </span>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={isFavorite ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
          aria-pressed={isFavorite}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: isFavorite ? '#FFF3E0' : '#F2F4F7',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <HeartIcon size={18} filled={isFavorite} />
        </button>
        <button
          type="button"
          aria-label="Compartir producto"
          onClick={async () => {
            // The prototype has no real per-product route yet (see AGENTS.md), so there's
            // no shareable URL to include -- share the name/price as text instead of a
            // broken or misleading link.
            const text = bestOffer
              ? `${product.name} — desde ${formatPrice(bestOffer.price)} en DóndeTa`
              : product.name
            if (navigator.share) {
              try { await navigator.share({ title: product.name, text }) } catch { /* user cancelled */ }
            } else if (navigator.clipboard) {
              await navigator.clipboard.writeText(text)
            }
          }}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#F2F4F7', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ShareIcon size={18} color="#0F1D2D" />
        </button>
      </div>

      {/* Product Image */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8EDF2' }}>
        <div style={{ height: 240, background: '#F8FAFC', overflow: 'hidden' }}>
          <img
            src={product.image}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{
            fontSize: 11, color: '#9AAABB', fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: 4, letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}>
            {product.brand} · {product.model}
          </div>
          <h1 style={{
            fontSize: 20, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            color: '#0F1D2D', margin: '0 0 4px',
            letterSpacing: '-0.03em',
          }}>
            {product.name}
          </h1>
          <div style={{
            fontSize: 14, color: '#5d7ea0',
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: 12,
          }}>
            {product.subtitle}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <StarIcon size={14} />
              <span style={{
                fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                color: '#0F1D2D',
              }}>
                {product.rating}
              </span>
            </div>
            <span style={{ fontSize: 11, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif" }}>
              ({product.reviews} opiniones)
            </span>
            {isBestPrice && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: '#E6F7F3', borderRadius: 999,
                padding: '3px 8px',
                fontSize: 11, color: '#00B894', fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
              }}>
                <TrendingDownIcon size={11} color="#00B894" />
                Buen precio
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price Summary */}
      <div style={{ margin: '12px 16px 0' }}>
        <ProductOfferSummary offers={product.prices} />
      </div>

      {/* Price History */}
      <div style={{ margin: '12px 16px 0' }}>
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #E8EDF2',
          boxShadow: '0 2px 8px rgba(15,29,45,0.04)',
          overflow: 'hidden', padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: '#0F1D2D',
            }}>
              Historial de precios
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {PERIODS.map(value => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setPeriod(value)}
                  aria-pressed={period === value}
                  style={{
                    padding: '4px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    background: period === value ? '#00B894' : 'transparent',
                    color: period === value ? '#fff' : '#9AAABB',
                    transition: 'all 0.15s',
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <PriceHistoryChart history={product.priceHistory} period={period} />
        </div>
      </div>

      {/* Sticky Bottom CTAs */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: '#fff',
        padding: '12px 16px',
        borderTop: '1px solid #E8EDF2',
        display: 'flex', gap: 10,
        boxShadow: '0 -4px 16px rgba(15,29,45,0.06)',
        zIndex: 50,
      }}>
        <button
          type="button"
          disabled={!bestOffer}
          onClick={() => (isLoggedIn ? setShowAlertSheet(true) : onRequireLogin())}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '13px 0',
            border: '1.5px solid #00B894', borderRadius: 12,
            background: '#E6F7F3', color: '#00B894',
            fontSize: 13, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            cursor: bestOffer ? 'pointer' : 'not-allowed',
            opacity: bestOffer ? 1 : 0.55,
          }}
        >
          <BellIcon size={16} color="#00B894" />
          Crear alerta
        </button>
        <button
          type="button"
          onClick={() => { if (bestOffer?.url) window.open(bestOffer.url, '_blank', 'noopener,noreferrer') }}
          disabled={!bestOffer?.url}
          style={{
            flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '13px 0',
            border: 'none', borderRadius: 12,
            background: bestOffer?.url ? '#00B894' : '#E8EDF2',
            color: bestOffer?.url ? '#fff' : '#9AAABB',
            fontSize: 14, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            cursor: bestOffer?.url ? 'pointer' : 'not-allowed',
            boxShadow: bestOffer?.url ? '0 4px 12px rgba(0,184,148,0.3)' : 'none',
          }}
        >
          <CheckIcon size={16} color={bestOffer?.url ? '#fff' : '#9AAABB'} />
          {bestOffer ? `Ver oferta en ${bestOffer.store}` : 'Oferta no disponible'}
        </button>
      </div>

      {/* Alert Bottom Sheet */}
      {showAlertSheet && bestOffer && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(15,29,45,0.5)',
            }}
            onClick={() => setShowAlertSheet(false)}
          />
          <div className="slide-up" style={{
            position: 'relative', width: '100%', maxWidth: 430,
            margin: '0 auto',
            background: '#fff', borderRadius: '20px 20px 0 0',
            padding: '20px 20px 36px',
          }}>
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: '#E8EDF2', margin: '0 auto 20px',
            }} />

            {alertCreated ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: '#E6F7F3', margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckIcon size={28} color="#00B894" />
                </div>
                <h3 style={{
                  fontSize: 18, fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  color: '#0F1D2D', margin: '0 0 8px',
                }}>
                  ¡Alerta creada!
                </h3>
                <p style={{
                  fontSize: 14, color: '#9AAABB',
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: '1.5',
                }}>
                  Te avisaremos cuando encontremos un mejor precio para {product.name}.
                </p>
              </div>
            ) : (
              <>
                <h3 style={{
                  fontSize: 18, fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  color: '#0F1D2D', margin: '0 0 4px',
                }}>
                  Crear alerta de precio
                </h3>
                <p style={{
                  fontSize: 13, color: '#9AAABB',
                  fontFamily: "'DM Sans', sans-serif",
                  margin: '0 0 20px',
                  lineHeight: '1.4',
                }}>
                  {product.name}
                </p>

                <div style={{
                  background: '#E6F7F3', borderRadius: 12,
                  padding: '12px 16px', marginBottom: 20,
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: 13, color: '#00B894',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                  }}>
                    Precio actual ({bestOffer.store})
                  </span>
                  <span style={{
                    fontSize: 16, fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    color: '#00B894',
                  }}>
                    {formatPrice(bestOffer.price)}
                  </span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="alert-target-price" style={{
                    fontSize: 12, fontWeight: 600, color: '#9AAABB',
                    fontFamily: "'DM Sans', sans-serif",
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'block', marginBottom: 8,
                  }}>
                    Precio objetivo
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#F2F4F7', borderRadius: 12,
                    padding: '0 16px', height: 52,
                    border: '1.5px solid #E8EDF2',
                  }}>
                    <span style={{
                      fontSize: 16, fontWeight: 700,
                      fontFamily: "'Poppins', sans-serif",
                      color: '#0F1D2D',
                    }}>
                      RD$
                    </span>
                    <input
                      id="alert-target-price"
                      value={alertPrice}
                      onChange={event => setAlertPrice(event.target.value)}
                      placeholder="22,000"
                      min="1"
                      type="number"
                      style={{
                        flex: 1, background: 'none', border: 'none', outline: 'none',
                        fontSize: 18, fontWeight: 700,
                        fontFamily: "'Poppins', sans-serif",
                        color: '#0F1D2D',
                      }}
                    />
                  </div>
                </div>

                {alertError && (
                  <div style={{
                    background: '#FFF0F0', border: '1px solid #FF3B3B30', borderRadius: 10,
                    padding: '10px 14px', marginBottom: 16,
                    fontSize: 12, color: '#FF3B3B',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {alertError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowAlertSheet(false)}
                    style={{
                      flex: 1, padding: '14px 0',
                      border: '1.5px solid #E8EDF2', borderRadius: 12,
                      background: '#fff', color: '#9AAABB',
                      fontSize: 14, fontWeight: 600,
                      fontFamily: "'Poppins', sans-serif",
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={createAlert}
                    disabled={creatingAlert}
                    style={{
                      flex: 2, padding: '14px 0',
                      border: 'none', borderRadius: 12,
                      background: '#00B894', color: '#fff',
                      fontSize: 14, fontWeight: 700,
                      fontFamily: "'Poppins', sans-serif",
                      cursor: creatingAlert ? 'not-allowed' : 'pointer',
                      opacity: creatingAlert ? 0.7 : 1,
                      boxShadow: '0 4px 12px rgba(0,184,148,0.3)',
                    }}
                  >
                    {creatingAlert ? 'Creando…' : 'Crear alerta'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
