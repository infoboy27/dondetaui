import { useState } from 'react'
import { ChevronLeft, MapPinIcon, ChevronRight, SearchIcon } from '../components/Icons'

function StarIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFD166" stroke="#FFD166" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

const STORES_NEARBY = [
  { name: 'Plaza Lama Churchill', abbr: 'PL', color: '#C0392B', distance: '1.2 km', rating: 4.3, open: true, cheapest: true, categories: 'Electrodomésticos · Hogar · Tecnología' },
  { name: 'Sirena Fernández', abbr: 'SI', color: '#2980B9', distance: '2.0 km', rating: 4.1, open: true, cheapest: false, categories: 'Electrodomésticos · Supermercado · Ropa' },
  { name: 'Corripio Miraflores', abbr: 'CO', color: '#27AE60', distance: '3.5 km', rating: 4.5, open: true, cheapest: false, categories: 'Electrodomésticos · Muebles · Tecnología' },
  { name: 'Jumbo Las Américas', abbr: 'JU', color: '#E67E22', distance: '4.1 km', rating: 4.2, open: false, categories: 'Electrodomésticos · Muebles · Decoración' },
  { name: 'PriceSmart Bella Vista', abbr: 'PS', color: '#8E44AD', distance: '5.8 km', rating: 4.7, open: true, cheapest: false, categories: 'Electrónica · Supermercado · Electrodomésticos' },
]

// Simple map placeholder with pins
function MapPlaceholder({ activeIdx, onPin }: { activeIdx: number; onPin: (i: number) => void }) {
  const pins = [
    { x: 38, y: 45 },
    { x: 55, y: 30 },
    { x: 65, y: 60 },
    { x: 75, y: 42 },
    { x: 85, y: 65 },
  ]

  return (
    <div style={{
      position: 'relative', height: 240, overflow: 'hidden',
      background: 'linear-gradient(145deg, #e8eff5 0%, #d4e1ec 100%)',
    }}>
      {/* Simulated roads */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#fff" strokeWidth="8" opacity="0.7" />
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#fff" strokeWidth="5" opacity="0.6" />
        <line x1="65%" y1="0" x2="65%" y2="100%" stroke="#fff" strokeWidth="6" opacity="0.6" />
        <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#fff" strokeWidth="4" opacity="0.5" />
        <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#fff" strokeWidth="4" opacity="0.5" />
        {/* City blocks */}
        <rect x="5%" y="5%" width="22%" height="22%" rx="3" fill="#d4e1ec" stroke="#c4d4e0" strokeWidth="1" />
        <rect x="34%" y="5%" width="28%" height="22%" rx="3" fill="#d4e1ec" stroke="#c4d4e0" strokeWidth="1" />
        <rect x="68%" y="5%" width="28%" height="22%" rx="3" fill="#d4e1ec" stroke="#c4d4e0" strokeWidth="1" />
        <rect x="5%" y="35%" width="22%" height="30%" rx="3" fill="#d0dce8" stroke="#c4d4e0" strokeWidth="1" />
        <rect x="34%" y="35%" width="28%" height="30%" rx="3" fill="#d0dce8" stroke="#c4d4e0" strokeWidth="1" />
        <rect x="68%" y="35%" width="28%" height="30%" rx="3" fill="#d0dce8" stroke="#c4d4e0" strokeWidth="1" />
        <rect x="5%" y="73%" width="22%" height="22%" rx="3" fill="#d4e1ec" stroke="#c4d4e0" strokeWidth="1" />
        <rect x="34%" y="73%" width="28%" height="22%" rx="3" fill="#d4e1ec" stroke="#c4d4e0" strokeWidth="1" />
        <rect x="68%" y="73%" width="28%" height="22%" rx="3" fill="#d4e1ec" stroke="#c4d4e0" strokeWidth="1" />

        {/* User location */}
        <circle cx="50%" cy="50%" r="8" fill="#00B894" opacity="0.25" />
        <circle cx="50%" cy="50%" r="5" fill="#00B894" stroke="#fff" strokeWidth="2" />

        {/* Store pins */}
        {pins.map((pin, i) => (
          <g key={i} onClick={() => onPin(i)} style={{ cursor: 'pointer' }}>
            <circle
              cx={`${pin.x}%`} cy={`${pin.y}%`}
              r={activeIdx === i ? 14 : 11}
              fill={activeIdx === i ? STORES_NEARBY[i].color : '#fff'}
              stroke={STORES_NEARBY[i].color}
              strokeWidth={2}
              style={{ transition: 'r 0.2s, fill 0.2s' }}
            />
            <text
              x={`${pin.x}%`} y={`${pin.y}%`}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={activeIdx === i ? 9 : 7}
              fontWeight="900"
              fontFamily="'Poppins', sans-serif"
              fill={activeIdx === i ? '#fff' : STORES_NEARBY[i].color}
            >
              {STORES_NEARBY[i].abbr}
            </text>
          </g>
        ))}
      </svg>

      {/* Map attribution */}
      <div style={{
        position: 'absolute', bottom: 8, right: 8,
        background: 'rgba(255,255,255,0.85)',
        borderRadius: 4, padding: '2px 6px',
        fontSize: 9, color: '#9AAABB',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Santo Domingo, RD
      </div>

      {/* My location badge */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: '#fff', borderRadius: 999,
        padding: '5px 12px',
        display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 2px 8px rgba(15,29,45,0.12)',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#00B894',
          boxShadow: '0 0 0 2px rgba(0,184,148,0.25)',
        }} />
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#0F1D2D',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Mi ubicación
        </span>
      </div>
    </div>
  )
}

interface Props {
  onBack: () => void
  onStore: () => void
}

export default function NearbyStoresScreen({ onBack, onStore }: Props) {
  const [sortBy, setSortBy] = useState<'distancia' | 'precio' | 'disponibilidad'>('distancia')
  const [activeStore, setActiveStore] = useState(0)

  const sorts = [
    { id: 'distancia' as const, label: 'Distancia' },
    { id: 'precio' as const, label: 'Mejor precio' },
    { id: 'disponibilidad' as const, label: 'Disponibilidad' },
  ]

  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        borderBottom: '1px solid #E8EDF2',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
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
          <h1 style={{
            fontSize: 20, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            color: '#0F1D2D', margin: 0,
            letterSpacing: '-0.03em',
          }}>
            Tiendas cerca de ti
          </h1>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#F2F4F7', borderRadius: 12,
          padding: '0 14px', height: 44,
          border: '1.5px solid #E8EDF2', marginBottom: 14,
        }}>
          <SearchIcon size={16} color="#9AAABB" />
          <span style={{
            fontSize: 13, color: '#9AAABB',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Buscar tienda o sucursal…
          </span>
        </div>

        {/* Sort chips */}
        <div style={{ display: 'flex', gap: 8 }}>
          {sorts.map(s => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              style={{
                padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                background: sortBy === s.id ? '#00B894' : '#F2F4F7',
                color: sortBy === s.id ? '#fff' : '#5d7ea0',
                transition: 'all 0.15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <MapPlaceholder activeIdx={activeStore} onPin={setActiveStore} />

      {/* Store cards */}
      <div style={{ padding: '16px 0 0' }}>
        <div style={{ padding: '0 16px', marginBottom: 12 }}>
          <span style={{
            fontSize: 13, color: '#9AAABB',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <strong style={{ color: '#0F1D2D', fontWeight: 700 }}>{STORES_NEARBY.length}</strong> tiendas encontradas
          </span>
        </div>

        {/* Horizontal scroll strip */}
        <div style={{
          display: 'flex', gap: 12, padding: '0 16px 16px',
          overflowX: 'auto',
        }}>
          {STORES_NEARBY.map((store, i) => (
            <div
              key={i}
              onClick={() => { setActiveStore(i); onStore() }}
              style={{
                width: 180, flexShrink: 0,
                background: '#fff', borderRadius: 16,
                border: `1.5px solid ${activeStore === i ? '#00B894' : '#E8EDF2'}`,
                padding: '14px', cursor: 'pointer',
                boxShadow: activeStore === i ? '0 4px 16px rgba(0,184,148,0.12)' : '0 2px 8px rgba(15,29,45,0.04)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: store.color + '15',
                  border: `1.5px solid ${store.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 900,
                    fontFamily: "'Poppins', sans-serif",
                    color: store.color,
                  }}>
                    {store.abbr}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    color: '#0F1D2D',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {store.name.split(' ')[0]}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <StarIcon size={11} />
                    <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: '#0F1D2D' }}>
                      {store.rating}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <MapPinIcon size={12} color="#9AAABB" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#00B894', fontFamily: "'DM Sans', sans-serif" }}>
                  {store.distance}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: store.open ? '#00B894' : '#FF3B3B',
                  background: store.open ? '#E6F7F3' : '#FFF0F0',
                  padding: '2px 6px', borderRadius: 999,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {store.open ? 'Abierto' : 'Cerrado'}
                </span>
                {store.cheapest && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: '#FF9F1C',
                    background: '#FFF3E0', padding: '2px 6px', borderRadius: 999,
                    fontFamily: "'Poppins', sans-serif",
                  }}>
                    + barato
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Full list */}
        <div style={{ padding: '0 16px 0' }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{
              fontSize: 15, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: '#0F1D2D',
            }}>
              Lista completa
            </span>
          </div>

          {STORES_NEARBY.map((store, i) => (
            <div
              key={i}
              onClick={() => { setActiveStore(i); onStore() }}
              style={{
                background: '#fff', borderRadius: 16,
                border: '1px solid #E8EDF2', padding: '14px 16px',
                marginBottom: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: store.color + '15',
                border: `1.5px solid ${store.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 14, fontWeight: 900,
                  fontFamily: "'Poppins', sans-serif",
                  color: store.color,
                }}>
                  {store.abbr}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  color: '#0F1D2D', marginBottom: 2,
                }}>
                  {store.name}
                </div>
                <div style={{
                  fontSize: 11, color: '#9AAABB',
                  fontFamily: "'DM Sans', sans-serif",
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {store.categories}
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: '#00B894',
                  fontFamily: "'DM Sans', sans-serif", marginBottom: 3,
                }}>
                  {store.distance}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: store.open ? '#00B894' : '#FF3B3B',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {store.open ? 'Abierto' : 'Cerrado'}
                </span>
              </div>

              <ChevronRight size={16} color="#B0C4D8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
