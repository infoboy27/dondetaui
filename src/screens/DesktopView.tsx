import { useState, useMemo } from 'react'
import { formatPrice, CATEGORIES } from '../data/mock'
import { SearchIcon, BellIcon, HeartIcon, FilterIcon, CheckIcon, TruckIcon, ChevronDown, StarIcon, TrendingDownIcon } from '../components/Icons'
import { getBestOffer, getOfferTotal, getSavingsRange } from '../domain/offers'
import { useCatalogProducts } from '../hooks/useCatalogProducts'
import type { Product } from '../types'

type SortKey = 'price-asc' | 'price-desc' | 'relevance'
type DesktopScreen = 'results' | 'categories' | 'stores' | 'deals' | 'alerts'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'price-asc', label: 'Precio ↑' },
  { key: 'price-desc', label: 'Precio ↓' },
  { key: 'relevance', label: 'Relevancia' },
]

interface Props {
  onMobile: () => void
}

const NAV_LINKS: { key: DesktopScreen; label: string }[] = [
  { key: 'categories', label: 'Categorías' },
  { key: 'stores', label: 'Tiendas' },
  { key: 'deals', label: 'Ofertas' },
  { key: 'alerts', label: 'Alertas' },
]
const STORE_COLORS: Record<string, string> = {
  'Plaza Lama': '#C0392B', Sirena: '#2980B9', Corripio: '#27AE60', Jumbo: '#E67E22', PriceSmart: '#8E44AD',
}
const STORE_FILTERS = ['Plaza Lama', 'Sirena', 'Corripio', 'Jumbo', 'PriceSmart']

function DesktopProductRow({ product, isAlerted, onToggleAlert }: {
  product: Product
  isAlerted: boolean
  onToggleAlert: () => void
}) {
  const cheapest = product.prices[0]
  const savings = product.prices[product.prices.length - 1].price - cheapest.price
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #E8EDF2',
      marginBottom: 16,
      overflow: 'hidden',
    }}>
      {/* Product summary row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 12,
          background: '#F8FAFC', flexShrink: 0, overflow: 'hidden',
          border: '1px solid #E8EDF2',
        }}>
          <img src={product.image} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, color: '#5d7ea0', fontFamily: "'DM Sans', sans-serif",
            marginBottom: 3, fontWeight: 500,
          }}>
            {product.brand} · {product.model}
          </div>
          <div style={{
            fontSize: 16, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            color: '#0F1D2D', marginBottom: 4,
            letterSpacing: '-0.02em',
          }}>
            {product.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarIcon size={13} />
            <span style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: '#0F1D2D', fontWeight: 600 }}>
              {product.rating}
            </span>
            <span style={{ fontSize: 12, color: '#5d7ea0', fontFamily: "'DM Sans', sans-serif" }}>
              ({product.reviews} opiniones)
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#5d7ea0', fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>
            Desde
          </div>
          <div style={{
            fontSize: 24, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            color: '#00B894', letterSpacing: '-0.04em',
          }}>
            {formatPrice(cheapest.price)}
          </div>
          <div style={{
            fontSize: 12, color: '#FF9F1C', fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Ahorras hasta {formatPrice(savings)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onToggleAlert} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            border: '1.5px solid #00B894', borderRadius: 10,
            background: isAlerted ? '#00B894' : '#E6F7F3',
            color: isAlerted ? '#fff' : '#00B894',
            padding: '10px 16px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
          }}>
            <BellIcon size={14} color={isAlerted ? '#fff' : '#00B894'} />
            {isAlerted ? 'Alerta activa' : 'Alerta'}
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            border: 'none', borderRadius: 10,
            background: '#00B894', color: '#fff',
            padding: '10px 16px', cursor: 'pointer',
            fontSize: 13, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            boxShadow: '0 4px 12px rgba(0,184,148,0.25)',
          }}>
            <CheckIcon size={14} color="#fff" />
            Ver oferta
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: 44, height: 44, borderRadius: 10,
              border: '1px solid #E8EDF2', background: '#F2F4F7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <ChevronDown size={16} color="#5d7ea0" />
            </span>
          </button>
        </div>
      </div>

      {/* Store comparison table */}
      {expanded && (
        <div style={{ borderTop: '1px solid #F2F4F7' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 140px',
            padding: '10px 20px', background: '#F8FAFC',
            borderBottom: '1px solid #F2F4F7',
          }}>
            {['Tienda', 'Precio', 'Envío', 'Disponibilidad', ''].map((h, i) => (
              <div key={i} style={{
                fontSize: 11, fontWeight: 700, color: '#5d7ea0',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase', letterSpacing: '0.04em',
                textAlign: i > 0 ? 'center' : 'left',
              }}>
                {h}
              </div>
            ))}
          </div>

          {product.prices.map((sp, i) => (
            <div
              key={sp.store}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 140px',
                padding: '12px 20px', alignItems: 'center',
                background: i === 0 ? '#E6F7F3' : '#fff',
                borderBottom: i < product.prices.length - 1 ? '1px solid #F2F4F7' : 'none',
                borderLeft: i === 0 ? '4px solid #00B894' : '4px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: sp.color + '18',
                  border: `1.5px solid ${sp.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800,
                    fontFamily: "'Poppins', sans-serif",
                    color: sp.color,
                  }}>
                    {sp.abbr}
                  </span>
                </div>
                <div>
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
                        background: '#00B894', padding: '2px 6px', borderRadius: 999,
                      }}>
                        MÁS BARATO
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#5d7ea0', fontFamily: "'DM Sans', sans-serif" }}>
                    Actualizado hace {sp.updated}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 16, fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  color: i === 0 ? '#00B894' : '#0F1D2D',
                  letterSpacing: '-0.02em',
                }}>
                  {formatPrice(sp.price)}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <TruckIcon size={12} color="#5d7ea0" />
                  <span style={{ fontSize: 12, color: '#0F1D2D', fontFamily: "'DM Sans', sans-serif" }}>
                    {sp.shipping}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  color: sp.available ? '#00B894' : '#FF3B3B',
                  background: sp.available ? '#E6F7F3' : '#FFF0F0',
                  padding: '4px 10px', borderRadius: 999,
                }}>
                  {sp.available ? 'En stock' : 'Sin stock'}
                </span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button style={{
                  border: 'none', borderRadius: 8,
                  background: sp.available ? '#00B894' : '#E8EDF2',
                  color: sp.available ? '#fff' : '#5d7ea0',
                  padding: '8px 16px', cursor: sp.available ? 'pointer' : 'not-allowed',
                  fontSize: 12, fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  Ver oferta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DesktopView({ onMobile }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100000)
  const [sortBy, setSortBy] = useState<SortKey>('price-asc')
  const [screen, setScreen] = useState<DesktopScreen>('results')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [alertedIds, setAlertedIds] = useState<Set<string>>(new Set())
  const { products, loading, error } = useCatalogProducts(query)

  const toggleStore = (s: string) => {
    setSelectedStores(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategory(prev => (prev === categoryId ? null : categoryId))
  }

  const availableCategories = useMemo(() => {
    const byId = new Map<string, { id: string; label: string }>()
    for (const p of products) {
      if (!byId.has(p.categoryId)) {
        byId.set(p.categoryId, { id: p.categoryId, label: p.category })
      }
    }
    return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [products])

  const runSearch = () => {
    setScreen('results')
  }

  const toggleAlert = (productId: string) => {
    setAlertedIds(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const goToCategory = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setScreen('results')
  }

  const goToStore = (store: string) => {
    setSelectedStores([store])
    setScreen('results')
  }

  const visibleProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const inStoreFilter =
        selectedStores.length === 0 ||
        p.prices.some(price => selectedStores.includes(price.store))
      const total = getOfferTotal(getBestOffer(p.prices) ?? p.prices[0])
      const inPriceRange = total >= minPrice && total <= maxPrice
      const inCategory = !selectedCategory || p.categoryId === selectedCategory
      const isDeal = screen !== 'deals' || p.discount > 0
      const isAlerted = screen !== 'alerts' || alertedIds.has(p.id)
      return inStoreFilter && inPriceRange && inCategory && isDeal && isAlerted
    })

    if (sortBy === 'relevance') return filtered

    const sorted = [...filtered].sort((a, b) => {
      const totalA = getOfferTotal(getBestOffer(a.prices) ?? a.prices[0])
      const totalB = getOfferTotal(getBestOffer(b.prices) ?? b.prices[0])
      return sortBy === 'price-asc' ? totalA - totalB : totalB - totalA
    })
    return sorted
  }, [products, selectedStores, minPrice, maxPrice, sortBy, selectedCategory, screen, alertedIds])

  const bestDeal = useMemo(() => {
    if (!visibleProducts.length) return null
    let best = visibleProducts[0]
    let bestTotal = getOfferTotal(getBestOffer(best.prices) ?? best.prices[0])
    for (const p of visibleProducts.slice(1)) {
      const total = getOfferTotal(getBestOffer(p.prices) ?? p.prices[0])
      if (total < bestTotal) {
        best = p
        bestTotal = total
      }
    }
    const offer = getBestOffer(best.prices) ?? best.prices[0]
    return { product: best, offer, savings: getSavingsRange(best.prices) }
  }, [visibleProducts])

  const screenTitle = screen === 'deals' ? 'Ofertas destacadas'
    : screen === 'alerts' ? 'Mis alertas'
    : query.trim() ? `Resultados para "${query}"`
    : 'Todos los productos'

  return (
    <div style={{ background: '#F2F4F7', minHeight: '100vh' }}>
      {/* Desktop Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #E8EDF2',
        padding: '0 40px',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(15,29,45,0.04)',
      }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: '#00B894',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,184,148,0.35)',
            }}>
              <span style={{ fontSize: 16, color: '#fff', fontWeight: 900, fontFamily: "'Poppins', sans-serif" }}>D</span>
            </div>
            <div>
              <div style={{
                fontSize: 18, fontWeight: 800,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D', letterSpacing: '-0.03em',
                lineHeight: 1,
              }}>
                DóndeTa
              </div>
              <div style={{
                fontSize: 9, color: '#5d7ea0',
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '0.02em',
              }}>
                Busca. Compara. Ahorra.
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{
            flex: 1, maxWidth: 480,
            display: 'flex', alignItems: 'center', gap: 10,
            background: focused ? '#fff' : '#F2F4F7',
            borderRadius: 12, padding: '0 16px', height: 44,
            border: `1.5px solid ${focused ? '#00B894' : '#E8EDF2'}`,
            transition: 'all 0.15s',
          }}>
            <SearchIcon size={17} color={focused ? '#00B894' : '#5d7ea0'} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => { if (e.key === 'Enter') runSearch() }}
              placeholder="Buscar productos, marcas o tiendas…"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 14, color: '#0F1D2D',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <button onClick={runSearch} style={{
              background: '#00B894', border: 'none', borderRadius: 8,
              color: '#fff', padding: '6px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
            }}>
              Buscar
            </button>
          </div>

          {/* Nav links */}
          <nav style={{ display: 'flex', gap: 4 }}>
            {NAV_LINKS.map(link => {
              const active = screen === link.key
              return (
                <button key={link.key} onClick={() => setScreen(link.key)} style={{
                  background: active ? '#E6F7F3' : 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 12px', minHeight: 44, borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  color: active ? '#00B894' : '#5d7ea0',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#E6F7F3'
                  e.currentTarget.style.color = '#00B894'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = active ? '#E6F7F3' : 'none'
                  e.currentTarget.style.color = active ? '#00B894' : '#5d7ea0'
                }}>
                  {link.label}
                </button>
              )
            })}
          </nav>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={{
              width: 44, height: 44, borderRadius: 10,
              background: '#F2F4F7', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <BellIcon size={18} color="#5d7ea0" />
              <span style={{
                position: 'absolute', top: 10, right: 10,
                width: 8, height: 8, borderRadius: '50%',
                background: '#FF3B3B', border: '1.5px solid #fff',
              }} />
            </button>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00B894, #00cba0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <span style={{
                fontSize: 13, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#fff',
              }}>
                CA
              </span>
            </div>
            <button
              onClick={onMobile}
              style={{
                background: '#E6F7F3', border: '1px solid #00B894',
                borderRadius: 8, padding: '7px 12px', minHeight: 44, cursor: 'pointer',
                fontSize: 12, color: '#00B894', fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Vista móvil
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div style={{
        maxWidth: 1360, margin: '0 auto', padding: '28px 40px', display: 'grid',
        gridTemplateColumns: screen === 'categories' || screen === 'stores' ? '1fr' : '240px 1fr', gap: 24,
      }}>
        {screen === 'categories' && (
          <section>
            <h1 style={{
              fontSize: 22, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
              color: '#0F1D2D', margin: '0 0 20px', letterSpacing: '-0.03em',
            }}>
              Categorías
            </h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => goToCategory(cat.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: cat.color, border: `1.5px solid ${cat.border}`,
                  borderRadius: 14, padding: '20px', cursor: 'pointer',
                  textAlign: 'left', minHeight: 44,
                }}>
                  <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                  <span style={{
                    fontSize: 15, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
                    color: '#0F1D2D',
                  }}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {screen === 'stores' && (
          <section>
            <h1 style={{
              fontSize: 22, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
              color: '#0F1D2D', margin: '0 0 20px', letterSpacing: '-0.03em',
            }}>
              Tiendas
            </h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {STORE_FILTERS.map(store => (
                <button key={store} onClick={() => goToStore(store)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#fff', border: '1px solid #E8EDF2',
                  borderRadius: 14, padding: '20px', cursor: 'pointer',
                  textAlign: 'left', minHeight: 44,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: STORE_COLORS[store] + '18',
                    border: `1.5px solid ${STORE_COLORS[store]}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{
                      fontSize: 13, fontWeight: 800, fontFamily: "'Poppins', sans-serif",
                      color: STORE_COLORS[store],
                    }}>
                      {store.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 15, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
                    color: '#0F1D2D',
                  }}>
                    {store}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {(screen === 'results' || screen === 'deals' || screen === 'alerts') && (
        <>
        {/* Sidebar */}
        <aside>
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid #E8EDF2',
            padding: '16px', position: 'sticky', top: 80,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <FilterIcon size={16} color="#0F1D2D" />
              <span style={{
                fontSize: 14, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D',
              }}>
                Filtros
              </span>
            </div>

            {/* Stores */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#5d7ea0',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: 10,
              }}>
                Tiendas
              </div>
              {STORE_FILTERS.map(store => (
                <label key={store} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', minHeight: 44, cursor: 'pointer',
                  borderBottom: '1px solid #F2F4F7',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedStores.includes(store)}
                    onChange={() => toggleStore(store)}
                    style={{
                      position: 'absolute', width: 1, height: 1, padding: 0,
                      margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0,
                    }}
                  />
                  <div aria-hidden="true" style={{
                    width: 18, height: 18, borderRadius: 5,
                    border: `2px solid ${selectedStores.includes(store) ? '#00B894' : '#D8E6F0'}`,
                    background: selectedStores.includes(store) ? '#00B894' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.12s',
                  }}>
                    {selectedStores.includes(store) && <CheckIcon size={10} color="#fff" />}
                  </div>
                  <span style={{
                    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    color: '#0F1D2D',
                  }}>
                    {store}
                  </span>
                </label>
              ))}
            </div>

            {/* Category */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#5d7ea0',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: 10,
              }}>
                Tipo de artículo
              </div>
              {availableCategories.map(cat => (
                <label key={cat.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', minHeight: 44, cursor: 'pointer',
                  borderBottom: '1px solid #F2F4F7',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedCategory === cat.id}
                    onChange={() => toggleCategory(cat.id)}
                    style={{
                      position: 'absolute', width: 1, height: 1, padding: 0,
                      margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0,
                    }}
                  />
                  <div aria-hidden="true" style={{
                    width: 18, height: 18, borderRadius: 5,
                    border: `2px solid ${selectedCategory === cat.id ? '#00B894' : '#D8E6F0'}`,
                    background: selectedCategory === cat.id ? '#00B894' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.12s',
                  }}>
                    {selectedCategory === cat.id && <CheckIcon size={10} color="#fff" />}
                  </div>
                  <span style={{
                    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    color: '#0F1D2D',
                  }}>
                    {cat.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Price Range */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#5d7ea0',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: 10,
              }}>
                Rango de precio
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{
                  flex: 1, background: '#F2F4F7', borderRadius: 8,
                  padding: '8px 10px', border: '1px solid #E8EDF2',
                }}>
                  <div style={{ fontSize: 9, color: '#5d7ea0', fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>
                    Desde
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Poppins', sans-serif", color: '#0F1D2D' }}>
                    {formatPrice(minPrice)}
                  </div>
                </div>
                <div style={{
                  flex: 1, background: '#F2F4F7', borderRadius: 8,
                  padding: '8px 10px', border: '1px solid #E8EDF2',
                }}>
                  <div style={{ fontSize: 9, color: '#5d7ea0', fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>
                    Hasta
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Poppins', sans-serif", color: '#0F1D2D' }}>
                    {formatPrice(maxPrice)}
                  </div>
                </div>
              </div>
              <input
                type="range" min={0} max={100000} step={500}
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#00B894' }}
              />
            </div>

            {/* Availability */}
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#5d7ea0',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: 10,
              }}>
                Disponibilidad
              </div>
              {['En stock', 'Con envío gratis', 'Con delivery'].map(opt => (
                <label key={opt} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', cursor: 'pointer',
                  borderBottom: '1px solid #F2F4F7',
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2px solid #D8E6F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  </div>
                  <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#0F1D2D' }}>
                    {opt}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results area */}
        {/* minWidth: 0 overrides the grid item's default min-width: auto, which otherwise
            refuses to shrink the 1fr column below its content's min-content width (long
            unbroken product names/prices) and pushes the whole page into horizontal
            overflow. */}
        <main style={{ minWidth: 0 }}>
          {/* Results header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{
                fontSize: 22, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D', margin: 0, letterSpacing: '-0.03em',
              }}>
                {screenTitle}
              </h1>
              <p style={{
                fontSize: 13, color: '#5d7ea0',
                fontFamily: "'DM Sans', sans-serif",
                margin: '4px 0 0',
              }}>
                {visibleProducts.length} productos comparados en {STORE_FILTERS.length} tiendas
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SORT_OPTIONS.map(({ key, label }) => (
                <button key={key} onClick={() => setSortBy(key)} style={{
                  padding: '8px 14px', minHeight: 44, borderRadius: 10,
                  border: sortBy === key ? '1.5px solid #00B894' : '1px solid #E8EDF2',
                  background: sortBy === key ? '#E6F7F3' : '#fff',
                  color: sortBy === key ? '#00B894' : '#5d7ea0',
                  fontSize: 13, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Best deal callout */}
          {bestDeal && screen !== 'alerts' && (
            <div style={{
              background: 'linear-gradient(135deg, #00B894 0%, #00cba0 100%)',
              borderRadius: 14,
              padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              marginBottom: 20,
            }}>
              <TrendingDownIcon size={24} color="#fff" />
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: "'DM Sans', sans-serif" }}>
                  Mejor oferta encontrada
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: "'Poppins', sans-serif" }}>
                  {bestDeal.product.name} — {bestDeal.offer.store} · {formatPrice(bestDeal.offer.price)}
                  {bestDeal.savings > 0 && ` · Ahorras ${formatPrice(bestDeal.savings)}`}
                </div>
              </div>
            </div>
          )}

          {/* Data source / error notice */}
          {error && (
            <div style={{
              background: '#FFF3E0', border: '1px solid #FF9F1C', borderRadius: 10,
              padding: '10px 16px', marginBottom: 16,
              color: '#0F1D2D', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            }}>
              No se pudo conectar con el catálogo en vivo — mostrando datos de referencia.
            </div>
          )}

          {/* Product rows */}
          {loading ? (
            <div style={{
              background: '#fff', borderRadius: 14, padding: '40px 20px',
              textAlign: 'center', color: '#5d7ea0',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            }}>
              Cargando productos…
            </div>
          ) : visibleProducts.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 14, padding: '40px 20px',
              textAlign: 'center', color: '#5d7ea0',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            }}>
              {screen === 'alerts'
                ? 'No tienes alertas activas. Haz clic en "Alerta" en cualquier producto para agregarlo aquí.'
                : 'No hay productos que coincidan con los filtros seleccionados.'}
            </div>
          ) : (
            visibleProducts.map(p => (
              <DesktopProductRow
                key={p.id}
                product={p}
                isAlerted={alertedIds.has(p.id)}
                onToggleAlert={() => toggleAlert(p.id)}
              />
            ))
          )}
        </main>
        </>
        )}
      </div>
    </div>
  )
}
