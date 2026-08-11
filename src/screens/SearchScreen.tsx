import { useState } from 'react'
import { SearchIcon, XIcon, ChevronRight, ClockIcon, TrendingUpIcon, MicIcon } from '../components/Icons'
import { RECENT_SEARCHES, TRENDING, CATEGORIES } from '../data/mock'

interface Props {
  onSearch: (q: string) => void
}

export default function SearchScreen({ onSearch }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES)

  const suggestions = query.length > 0
    ? [...TRENDING, ...recentSearches].filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : []

  const handleSubmit = () => {
    if (query.trim()) onSearch(query)
  }

  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 80 }}>
      {/* Search Header */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        borderBottom: '1px solid #E8EDF2',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <h1 style={{
          fontSize: 20, fontWeight: 700,
          fontFamily: "'Poppins', sans-serif",
          color: '#0F1D2D', margin: '0 0 12px',
          letterSpacing: '-0.03em',
        }}>
          Buscar
        </h1>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: focused ? '#fff' : '#F2F4F7',
          borderRadius: 14,
          padding: '0 14px', height: 48,
          border: `1.5px solid ${focused ? '#00B894' : '#E8EDF2'}`,
          transition: 'border-color 0.15s, background 0.15s',
        }}>
          <SearchIcon size={18} color={focused ? '#00B894' : '#9AAABB'} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Buscar productos, marcas o tiendas…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 14, color: '#0F1D2D',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
            >
              <XIcon size={16} color="#9AAABB" />
            </button>
          ) : (
            <MicIcon size={18} color="#9AAABB" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div style={{
          background: '#fff',
          margin: '0 0 8px',
          borderBottom: '1px solid #E8EDF2',
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setQuery(s); onSearch(s) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 20px', background: 'none', border: 'none',
                borderBottom: i < suggestions.length - 1 ? '1px solid #F2F4F7' : 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <SearchIcon size={16} color="#B0C4D8" />
              <span style={{
                flex: 1, fontSize: 14, color: '#0F1D2D',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {s}
              </span>
              <ChevronRight size={14} color="#B0C4D8" />
            </button>
          ))}
        </div>
      )}

      {/* Content when no query */}
      {!query && (
        <div style={{ padding: '20px 20px 0' }}>
          {/* Recent */}
          {recentSearches.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{
                fontSize: 15, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D', margin: 0,
              }}>
                Búsquedas recientes
              </h2>
              <button
                onClick={() => setRecentSearches([])}
                style={{
                  fontSize: 12, color: '#9AAABB',
                  fontFamily: "'DM Sans', sans-serif",
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                Borrar
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {recentSearches.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(s); onSearch(s) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#fff',
                    border: '1px solid #E8EDF2',
                    borderRadius: 999, padding: '7px 14px',
                    cursor: 'pointer', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F2F4F7')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <ClockIcon size={13} color="#9AAABB" />
                  <span style={{
                    fontSize: 13, color: '#0F1D2D',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {s}
                  </span>
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Trending */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <TrendingUpIcon size={16} color="#FF9F1C" />
              <h2 style={{
                fontSize: 15, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D', margin: 0,
              }}>
                Lo más buscado
              </h2>
            </div>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #E8EDF2',
              overflow: 'hidden',
            }}>
              {TRENDING.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(s); onSearch(s) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', background: 'none', border: 'none',
                    borderBottom: i < TRENDING.length - 1 ? '1px solid #F2F4F7' : 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: 8,
                    background: i < 3 ? '#E6F7F3' : '#F2F4F7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    color: i < 3 ? '#00B894' : '#9AAABB',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{
                    flex: 1, fontSize: 14, color: '#0F1D2D',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {s}
                  </span>
                  <ChevronRight size={14} color="#B0C4D8" />
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{
              fontSize: 15, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: '#0F1D2D', margin: '0 0 12px',
            }}>
              Explorar categorías
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onSearch(cat.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: cat.color,
                    border: `1.5px solid ${cat.border}22`,
                    borderRadius: 14, padding: '14px 16px',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'transform 0.12s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <span style={{ fontSize: 24 }}>{cat.emoji}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#0F1D2D',
                    lineHeight: 1.2,
                  }}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
