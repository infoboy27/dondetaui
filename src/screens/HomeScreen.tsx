import { useState } from 'react'
import { PRODUCTS, CATEGORIES, formatPrice } from '../data/mock'
import { SearchIcon, BellIcon, HeartIcon, MicIcon, ChevronRight, ZapIcon } from '../components/Icons'
import type { Product } from '../types'

interface Props {
  onSearch: (q: string) => void
  onProduct: (p: Product) => void
  onCategory: (cat: string) => void
  onEquipa?: () => void
  onNearby?: () => void
}

function DiscountBadge({ pct }: { pct: number }) {
  return (
    <span style={{
      background: '#FF9F1C',
      color: '#fff',
      fontSize: 11,
      fontWeight: 700,
      fontFamily: "'Poppins', sans-serif",
      padding: '2px 7px',
      borderRadius: 999,
      letterSpacing: '-0.01em',
    }}>
      -{pct}%
    </span>
  )
}

function ProductCard({ product, onProduct }: { product: Product; onProduct: (p: Product) => void }) {
  const [fav, setFav] = useState(product.favorite ?? false)
  const cheapest = product.prices[0]

  return (
    <div
      onClick={() => onProduct(product)}
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #E8EDF2',
        boxShadow: '0 2px 8px rgba(15,29,45,0.05)',
        cursor: 'pointer',
        width: 180,
        flexShrink: 0,
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 18px rgba(15,29,45,0.10)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(15,29,45,0.05)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', background: '#F8FAFC', height: 140 }}>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <DiscountBadge pct={product.discount} />
        </div>
        <button
          onClick={e => { e.stopPropagation(); setFav(!fav) }}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
        >
          <HeartIcon size={15} filled={fav} />
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{
          fontSize: 12, color: '#9AAABB', fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif", marginBottom: 2,
        }}>
          {cheapest.store}
        </div>
        <div style={{
          fontSize: 13, color: '#0F1D2D', fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: '1.3',
          marginBottom: 8,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {product.name}
        </div>
        <div style={{
          fontSize: 18, fontWeight: 700,
          fontFamily: "'Poppins', sans-serif",
          color: '#0F1D2D', letterSpacing: '-0.03em',
          lineHeight: 1,
        }}>
          {formatPrice(cheapest.price)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <span style={{
            fontSize: 11, color: '#9AAABB',
            fontFamily: "'DM Sans', sans-serif",
            textDecoration: 'line-through',
          }}>
            {formatPrice(product.previousPrice)}
          </span>
          <span style={{
            fontSize: 11, color: '#00B894', fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Ahorras {formatPrice(product.previousPrice - cheapest.price)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function HomeScreen({ onSearch, onProduct, onCategory, onEquipa, onNearby }: Props) {
  const [query, setQuery] = useState('')

  return (
    <div style={{
      background: '#F2F4F7',
      minHeight: '100%',
      paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 20px 20px',
        borderBottom: '1px solid #E8EDF2',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{
              fontSize: 13, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 400,
            }}>
              ¡Buenos días! 👋
            </div>
            <h1 style={{
              fontSize: 22, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: '#0F1D2D', margin: 0,
              letterSpacing: '-0.03em',
            }}>
              ¿Dónde 'ta más barato?
            </h1>
          </div>
          <button style={{
            width: 42, height: 42, borderRadius: '50%',
            background: '#E6F7F3', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <BellIcon size={20} color="#00B894" />
            <span style={{
              position: 'absolute', top: 8, right: 8,
              width: 8, height: 8, borderRadius: '50%',
              background: '#FF3B3B', border: '1.5px solid #fff',
            }} />
          </button>
        </div>

        {/* Search Bar */}
        <div
          onClick={() => onSearch(query)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#F2F4F7', borderRadius: 14,
            padding: '0 14px', height: 48, cursor: 'text',
            border: '1.5px solid #E8EDF2',
            transition: 'border-color 0.15s',
          }}
        >
          <SearchIcon size={18} color="#9AAABB" />
          <span style={{
            flex: 1, fontSize: 14, color: '#9AAABB',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Buscar productos, marcas o tiendas…
          </span>
          <MicIcon size={18} color="#9AAABB" />
        </div>
      </div>

      {/* DóndeTa Banner */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, #00B894 0%, #00cba0 100%)',
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(0,184,148,0.25)',
        }}>
          <div>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.75)',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500, marginBottom: 2,
            }}>
              Busca. Compara. Ahorra.
            </div>
            <div style={{
              fontSize: 16, color: '#fff',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600, letterSpacing: '-0.02em',
            }}>
              Antes de comprar, mira DóndeTa
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ZapIcon size={24} color="#fff" />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{
            fontSize: 17, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            color: '#0F1D2D', margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Categorías destacadas
          </h2>
          <button style={{
            fontSize: 13, color: '#00B894', fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            Ver todas <ChevronRight size={14} color="#00B894" />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategory(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: cat.color,
                border: `1.5px solid ${cat.border}22`,
                borderRadius: 12, padding: '8px 14px',
                cursor: 'pointer', transition: 'transform 0.12s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span style={{ fontSize: 18 }}>{cat.emoji}</span>
              <span style={{
                fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                color: '#0F1D2D',
              }}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ofertas de hoy */}
      <div style={{ padding: '24px 0 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{
              fontSize: 17, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: '#0F1D2D', margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Ofertas de hoy
            </h2>
            <span style={{
              background: '#FF9F1C', color: '#fff',
              fontSize: 10, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              padding: '2px 6px', borderRadius: 999,
            }}>
              LIVE
            </span>
          </div>
          <button style={{
            fontSize: 13, color: '#00B894', fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            Ver todas <ChevronRight size={14} color="#00B894" />
          </button>
        </div>
        <div style={{
          display: 'flex', gap: 14, padding: '4px 20px 8px',
          overflowX: 'auto',
        }}>
          {PRODUCTS.map(p => (
            <ProductCard key={p.id} product={p} onProduct={onProduct} />
          ))}
        </div>
      </div>

      {/* Quick action cards */}
      <div style={{ padding: '20px 20px 0', display: 'flex', gap: 10 }}>
        {/* Equipa tu hogar */}
        <button
          onClick={() => onEquipa?.()}
          style={{
            flex: 1, background: '#fff',
            borderRadius: 16, border: '1px solid #E8EDF2',
            padding: '14px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', gap: 8,
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 24 }}>🏠</span>
          <div style={{
            fontSize: 13, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            color: '#0F1D2D', lineHeight: '1.2',
          }}>
            Equipa tu hogar
          </div>
          <span style={{
            fontSize: 9, color: '#FF9F1C', fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            background: '#FFF3E0', padding: '2px 6px', borderRadius: 999,
            alignSelf: 'flex-start',
          }}>
            PRÓXIMO
          </span>
        </button>

        {/* Tiendas cerca */}
        <button
          onClick={() => onNearby?.()}
          style={{
            flex: 1, background: '#E6F7F3',
            borderRadius: 16, border: '1px solid #00B89430',
            padding: '14px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', gap: 8,
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 24 }}>📍</span>
          <div style={{
            fontSize: 13, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            color: '#0F1D2D', lineHeight: '1.2',
          }}>
            Tiendas cerca de ti
          </div>
          <span style={{
            fontSize: 9, color: '#00B894', fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            background: '#fff', padding: '2px 6px', borderRadius: 999,
            alignSelf: 'flex-start',
          }}>
            5 CERCANAS
          </span>
        </button>
      </div>

      {/* Trust note */}
      <div style={{ padding: '16px 20px 0', textAlign: 'center' }}>
        <span style={{
          fontSize: 11, color: '#B0C4D8',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Precios actualizados cada hora · Disponibilidad puede variar
        </span>
      </div>
    </div>
  )
}
