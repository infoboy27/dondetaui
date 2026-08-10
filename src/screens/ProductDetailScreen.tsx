import { useState } from 'react'
import { formatPrice } from '../data/mock'
import {
  ChevronLeft, HeartIcon, ShareIcon, StarIcon,
  TruckIcon, ClockIcon, CheckIcon, BellIcon, MapPinIcon,
  TrendingDownIcon,
} from '../components/Icons'
import type { Product } from '../types'

interface Props {
  product: Product
  onBack: () => void
}

function PriceHistoryChart({ history, period }: { history: { date: string; price: number }[]; period: string }) {
  const days = period === '7D' ? 7 : period === '30D' ? 30 : period === '90D' ? 90 : period === '6M' ? 180 : 365
  const data = history.slice(-Math.min(days, history.length))

  const prices = data.map(d => d.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const current = prices[prices.length - 1]
  const lowest = min
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)

  const W = 320
  const H = 100
  const PAD = 8

  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: PAD + ((max - d.price) / range) * (H - PAD * 2),
  }))

  const linePath = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${pts[0].x.toFixed(1)} ${H} Z`

  const lowestPt = pts[prices.indexOf(min)]
  const lowestDate = data[prices.indexOf(min)]?.date

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 4}`} style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00B894" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00B894" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chartGrad)" />
        <path d={linePath} fill="none" stroke="#00B894" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {lowestPt && (
          <>
            <circle cx={lowestPt.x} cy={lowestPt.y} r="4" fill="#FF9F1C" stroke="#fff" strokeWidth="2" />
          </>
        )}
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4" fill="#00B894" stroke="#fff" strokeWidth="2" />
      </svg>

      <div style={{ display: 'flex', gap: 0, marginTop: 12 }}>
        {[
          { label: 'Actual', value: current, color: '#00B894' },
          { label: 'Mínimo', value: lowest, color: '#FF9F1C' },
          { label: 'Promedio', value: avg, color: '#9AAABB' },
          { label: 'Máximo', value: max, color: '#0F1D2D' },
        ].map((stat, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRight: i < 3 ? '1px solid #F2F4F7' : 'none' }}>
            <div style={{
              fontSize: 11, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 3,
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: stat.color, letterSpacing: '-0.02em',
            }}>
              {formatPrice(stat.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProductDetailScreen({ product, onBack }: Props) {
  const [fav, setFav] = useState(product.favorite ?? false)
  const [period, setPeriod] = useState('30D')
  const [showAlertSheet, setShowAlertSheet] = useState(false)
  const [alertPrice, setAlertPrice] = useState('')
  const [alertCreated, setAlertCreated] = useState(false)

  const cheapest = product.prices[0]
  const savings = product.prices[product.prices.length - 1].price - cheapest.price
  const periods = ['7D', '30D', '90D', '6M', '1A']

  const priceMin = Math.min(...product.priceHistory.map(h => h.price))
  const isBestPrice = cheapest.price <= priceMin * 1.05

  const createAlert = () => {
    setAlertCreated(true)
    setTimeout(() => {
      setShowAlertSheet(false)
      setAlertCreated(false)
    }, 2000)
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
          flex: 1, fontSize: 15, fontWeight: 600,
          fontFamily: "'Poppins', sans-serif",
          color: '#0F1D2D',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {product.subtitle}
        </span>
        <button
          onClick={() => setFav(!fav)}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: fav ? '#FFF3E0' : '#F2F4F7',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <HeartIcon size={18} filled={fav} />
        </button>
        <button style={{
          width: 36, height: 36, borderRadius: 10,
          background: '#F2F4F7', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShareIcon size={18} color="#0F1D2D" />
        </button>
      </div>

      {/* Product Image */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8EDF2',
      }}>
        <div style={{ height: 240, background: '#F8FAFC', overflow: 'hidden' }}>
          <img src={product.image} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #E8EDF2',
          boxShadow: '0 2px 8px rgba(15,29,45,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F2F4F7' }}>
            <div style={{
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: '#0F1D2D',
            }}>
              Resumen de precios
            </div>
            <div style={{
              fontSize: 11, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif",
              marginTop: 2,
            }}>
              {product.prices.length} tiendas comparadas
            </div>
          </div>

          {product.prices.map((sp, i) => (
            <div
              key={sp.store}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: i === 0 ? '#E6F7F3' : '#fff',
                borderBottom: i < product.prices.length - 1 ? '1px solid #F2F4F7' : 'none',
                borderLeft: i === 0 ? '3px solid #00B894' : '3px solid transparent',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: sp.color + '18',
                border: `1.5px solid ${sp.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  fontFamily: "'Poppins', sans-serif",
                  color: sp.color,
                }}>
                  {sp.abbr}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#0F1D2D',
                  }}>
                    {sp.store}
                  </span>
                  {i === 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#fff',
                      fontFamily: "'Poppins', sans-serif",
                      background: '#00B894', padding: '2px 6px',
                      borderRadius: 999,
                    }}>
                      MÁS BARATO
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <TruckIcon size={10} color="#9AAABB" />
                    <span style={{ fontSize: 10, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif" }}>
                      {sp.shipping}
                    </span>
                  </div>
                  <span style={{ fontSize: 9, color: '#D8E6F0' }}>·</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPinIcon size={10} color="#9AAABB" />
                    <span style={{ fontSize: 10, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif" }}>
                      {sp.distance}
                    </span>
                  </div>
                  {!sp.available && (
                    <span style={{
                      fontSize: 9, color: '#FF3B3B',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      Sin stock
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 15, fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  color: i === 0 ? '#00B894' : '#0F1D2D',
                  letterSpacing: '-0.02em',
                }}>
                  {formatPrice(sp.price)}
                </div>
                {i === 0 && (
                  <div style={{
                    fontSize: 10, color: '#FF9F1C', fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Ahorras {formatPrice(savings)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Store time note */}
          <div style={{
            padding: '10px 16px',
            background: '#F8FAFC',
            borderTop: '1px solid #F2F4F7',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClockIcon size={12} color="#9AAABB" />
              <span style={{
                fontSize: 11, color: '#9AAABB',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Actualizado hace 20 min · Disponibilidad puede variar
              </span>
            </div>
          </div>
        </div>
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
              {periods.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '4px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    background: period === p ? '#00B894' : 'transparent',
                    color: period === p ? '#fff' : '#9AAABB',
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
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
          onClick={() => setShowAlertSheet(true)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '13px 0',
            border: '1.5px solid #00B894', borderRadius: 12,
            background: '#E6F7F3', color: '#00B894',
            fontSize: 13, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            cursor: 'pointer',
          }}
        >
          <BellIcon size={16} color="#00B894" />
          Crear alerta
        </button>
        <button
          style={{
            flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '13px 0',
            border: 'none', borderRadius: 12,
            background: '#00B894', color: '#fff',
            fontSize: 14, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,184,148,0.3)',
          }}
        >
          <CheckIcon size={16} color="#fff" />
          Ver oferta en {cheapest.store}
        </button>
      </div>

      {/* Alert Bottom Sheet */}
      {showAlertSheet && (
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
                    Precio actual (Plaza Lama)
                  </span>
                  <span style={{
                    fontSize: 16, fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    color: '#00B894',
                  }}>
                    {formatPrice(cheapest.price)}
                  </span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{
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
                      value={alertPrice}
                      onChange={e => setAlertPrice(e.target.value)}
                      placeholder="22,000"
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

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
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
                    onClick={createAlert}
                    style={{
                      flex: 2, padding: '14px 0',
                      border: 'none', borderRadius: 12,
                      background: '#00B894', color: '#fff',
                      fontSize: 14, fontWeight: 700,
                      fontFamily: "'Poppins', sans-serif",
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,184,148,0.3)',
                    }}
                  >
                    Crear alerta
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
