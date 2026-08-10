import { useState } from 'react'
import { PRODUCTS, formatPrice } from '../data/mock'
import { ChevronLeft, FilterIcon, HeartIcon, ChevronDown, CheckIcon, TruckIcon, ClockIcon } from '../components/Icons'
import type { Product } from '../types'

interface Props {
  query: string
  onBack: () => void
  onProduct: (p: Product) => void
}

function StorePriceRow({
  store, abbr, color, price, shipping, available, updated, isBest, savings
}: {
  store: string; abbr: string; color: string; price: number
  shipping: string; available: boolean; updated: string
  isBest: boolean; savings: number
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px',
      background: isBest ? '#E6F7F3' : '#fff',
      borderBottom: '1px solid #F2F4F7',
      borderLeft: isBest ? '3px solid #00B894' : '3px solid transparent',
      transition: 'background 0.12s',
    }}>
      {/* Store avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: color + '18',
        border: `1.5px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 800,
          fontFamily: "'Poppins', sans-serif",
          color: color,
        }}>
          {abbr}
        </span>
      </div>

      {/* Store info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            color: '#0F1D2D',
          }}>
            {store}
          </span>
          {isBest && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: '#fff',
              fontFamily: "'Poppins', sans-serif",
              background: '#00B894', padding: '2px 6px',
              borderRadius: 999, letterSpacing: '0.03em',
            }}>
              MÁS BARATO
            </span>
          )}
          {!available && (
            <span style={{
              fontSize: 9, fontWeight: 600, color: '#FF3B3B',
              fontFamily: "'DM Sans', sans-serif",
              background: '#FFF0F0', padding: '2px 6px',
              borderRadius: 999,
            }}>
              Sin stock
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <TruckIcon size={11} color="#9AAABB" />
            <span style={{
              fontSize: 11, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {shipping}
            </span>
          </div>
          <span style={{ fontSize: 9, color: '#D8E6F0' }}>·</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <ClockIcon size={11} color="#9AAABB" />
            <span style={{
              fontSize: 11, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Hace {updated}
            </span>
          </div>
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: 16, fontWeight: 700,
          fontFamily: "'Poppins', sans-serif",
          color: isBest ? '#00B894' : '#0F1D2D',
          letterSpacing: '-0.02em',
        }}>
          {formatPrice(price)}
        </div>
        {isBest && savings > 0 && (
          <div style={{
            fontSize: 10, color: '#FF9F1C', fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Ahorras {formatPrice(savings)}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductComparisonCard({ product, onProduct }: { product: Product; onProduct: (p: Product) => void }) {
  const [fav, setFav] = useState(product.favorite ?? false)
  const [expanded, setExpanded] = useState(false)
  const cheapest = product.prices[0]
  const mostExpensive = product.prices[product.prices.length - 1]
  const savings = mostExpensive.price - cheapest.price
  const displayPrices = expanded ? product.prices : product.prices.slice(0, 3)

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #E8EDF2',
      boxShadow: '0 2px 8px rgba(15,29,45,0.04)',
      overflow: 'hidden',
      marginBottom: 14,
    }}>
      {/* Product header */}
      <div
        style={{ display: 'flex', gap: 12, padding: '14px 14px 12px', cursor: 'pointer' }}
        onClick={() => onProduct(product)}
      >
        <div style={{
          width: 68, height: 68, borderRadius: 12,
          background: '#F8FAFC', flexShrink: 0, overflow: 'hidden',
          border: '1px solid #E8EDF2',
        }}>
          <img src={product.image} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10, color: '#9AAABB', fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif", marginBottom: 2,
          }}>
            {product.brand} · {product.model}
          </div>
          <div style={{
            fontSize: 14, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            color: '#0F1D2D', marginBottom: 4,
            lineHeight: '1.3',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {product.subtitle}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif" }}>
              Desde
            </span>
            <span style={{
              fontSize: 18, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: '#00B894', letterSpacing: '-0.03em',
            }}>
              {formatPrice(cheapest.price)}
            </span>
          </div>
          <div style={{
            fontSize: 11, color: '#FF9F1C', fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Ahorras hasta {formatPrice(savings)} vs tienda más cara
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setFav(!fav) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            alignSelf: 'flex-start', padding: 4,
          }}
        >
          <HeartIcon size={18} filled={fav} />
        </button>
      </div>

      {/* Store prices */}
      <div style={{ borderTop: '1px solid #F2F4F7' }}>
        {displayPrices.map((sp, i) => (
          <StorePriceRow
            key={sp.store}
            {...sp}
            isBest={i === 0}
            savings={savings}
          />
        ))}
      </div>

      {/* Expand / actions */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '10px 14px',
        borderTop: '1px solid #F2F4F7',
        gap: 8,
      }}>
        {product.prices.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <span style={{ display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <ChevronDown size={14} color="#9AAABB" />
            </span>
            {expanded ? 'Ver menos' : `${product.prices.length - 3} tiendas más`}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => onProduct(product)}
          style={{
            background: '#00B894', color: '#fff',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            padding: '9px 18px',
            fontSize: 13, fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
            letterSpacing: '-0.01em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <CheckIcon size={14} color="#fff" />
          Ver oferta
        </button>
      </div>
    </div>
  )
}

export default function ResultsScreen({ query, onBack, onProduct }: Props) {
  const [sortBy, setSortBy] = useState<'precio' | 'relevancia'>('precio')
  const [showFilters, setShowFilters] = useState(false)

  const results = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase()) ||
    p.brand.toLowerCase().includes(query.toLowerCase()) ||
    query.toLowerCase().includes(p.brand.toLowerCase())
  )
  const displayResults = results.length ? results : PRODUCTS

  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        borderBottom: '1px solid #E8EDF2',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
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
          <div style={{
            flex: 1, background: '#F2F4F7',
            borderRadius: 12, padding: '10px 14px',
            fontSize: 14, color: '#0F1D2D',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
          }}>
            {query || 'Lavadora Samsung'}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: 13, color: '#9AAABB',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <strong style={{ color: '#0F1D2D', fontWeight: 600 }}>{displayResults.length}</strong> resultados encontrados
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#F2F4F7', border: '1px solid #E8EDF2',
                borderRadius: 10, padding: '7px 12px', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", color: '#0F1D2D',
              }}
            >
              <FilterIcon size={13} color="#0F1D2D" />
              Filtros
            </button>
            <button
              onClick={() => setSortBy(s => s === 'precio' ? 'relevancia' : 'precio')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: sortBy === 'precio' ? '#E6F7F3' : '#F2F4F7',
                border: `1px solid ${sortBy === 'precio' ? '#00B894' : '#E8EDF2'}`,
                borderRadius: 10, padding: '7px 12px', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                color: sortBy === 'precio' ? '#00B894' : '#0F1D2D',
              }}
            >
              Precio ↑
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{
          background: '#fff', padding: '16px 20px',
          borderBottom: '1px solid #E8EDF2',
        }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif",
              textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: 8,
            }}>
              Tiendas
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Plaza Lama', 'Sirena', 'Corripio', 'Jumbo', 'PriceSmart'].map(s => (
                <button key={s} style={{
                  background: '#E6F7F3', border: '1px solid #00B894',
                  borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
                  fontSize: 12, color: '#00B894', fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 12, fontWeight: 600, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif",
              textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: 8,
            }}>
              Disponibilidad
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['En stock', 'Con envío gratis'].map(s => (
                <button key={s} style={{
                  background: '#F2F4F7', border: '1px solid #E8EDF2',
                  borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
                  fontSize: 12, color: '#5d7ea0', fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{ padding: '16px 16px 0' }}>
        {displayResults.map(p => (
          <ProductComparisonCard key={p.id} product={p} onProduct={onProduct} />
        ))}
      </div>

      <div style={{ padding: '0 20px 8px', textAlign: 'center' }}>
        <span style={{
          fontSize: 11, color: '#B0C4D8',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Precios actualizados regularmente · Verifica disponibilidad en tienda
        </span>
      </div>
    </div>
  )
}
