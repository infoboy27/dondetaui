import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPrice, CATEGORIES } from '../data/mock'
import { AD_SIZES } from '../data/adSizes'
import { appConfig } from '../config/env'
import { SearchIcon, BellIcon, HeartIcon, FilterIcon, CheckIcon, TruckIcon, ChevronDown, StarIcon, TrendingDownIcon, UserIcon, DiscordIcon, AndroidIcon, AppleIcon, DondeTaMark } from '../components/Icons'
import { getBestOffer, getOfferTotal, getSavingsRange } from '../domain/offers'
import { getPriceDropNotifications, getRecentPriceDrop } from '../domain/notifications'
import { userInitials } from '../domain/user'
import { useCatalogProducts } from '../hooks/useCatalogProducts'
import { usePagination } from '../hooks/usePagination'
import PaginationControls from '../components/PaginationControls'
import { useProductReviews } from '../hooks/useProductReviews'
import { useSearchHistory } from '../hooks/useSearchHistory'
import AdBanner from '../components/AdBanner'
import ProductImage from '../components/ProductImage'
import StoreLogo from '../components/StoreLogo'
import type { Product, User } from '../types'

type SortKey = 'price-asc' | 'price-desc' | 'relevance'
type DesktopScreen = 'results' | 'categories' | 'stores' | 'deals' | 'alerts'

const DISCORD_INVITE_URL = 'https://discord.gg/sxcSngrTZv'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'price-asc', label: 'Precio ↑' },
  { key: 'price-desc', label: 'Precio ↓' },
  { key: 'relevance', label: 'Relevancia' },
]

interface Props {
  onMobile: () => void
  alertedIds: Set<string>
  onToggleAlert: (id: string) => void
  favoriteIds: Set<string>
  onToggleFavorite: (id: string) => void
  user: User | null
  onLogout: () => void
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
// This screen's own "Tiendas" grid only has plain store name strings
// (STORE_FILTERS), not a full offer/store object with a real .abbr -- and
// name.slice(0,2) doesn't match the canonical abbr for every store
// (PriceSmart -> "PR" that way, but "PS" everywhere else in the app).
const STORE_ABBRS: Record<string, string> = {
  'Plaza Lama': 'PL', Sirena: 'SI', Corripio: 'CO', Jumbo: 'JU', PriceSmart: 'PS',
}
const STORE_FILTERS = ['Plaza Lama', 'Sirena', 'Corripio', 'Jumbo', 'PriceSmart']

// The "Categorías" screen's 6 curated buckets are a fixed, hand-picked taxonomy — real
// ingested products carry much more granular, retailer-derived categoryIds (abanicos,
// aires-acondicionados, estufas, neveras, televisores...) that rarely match those 6 ids
// by exact string equality. Keyword lists (reusing the same appliance vocabulary already
// vetted for the ingestion safety net in apps/api/src/ingestion/ingestion.repository.ts)
// let a curated bucket match the real category data instead of returning empty/wrong
// results. Hogar and Muebles have no keywords: DóndeTa doesn't currently ingest anything
// in those departments, so they correctly show no results rather than mismatched ones.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  electrodomesticos: ['electrodomest', 'linea blanca', 'nevera', 'refriger', 'congelad', 'freezer', 'lavador', 'lavaplat', 'secador', 'lavad', 'plancha', 'aspirad', 'dispensador'],
  aires: ['acondicionad', 'climatiz', 'abanico', 'ventilad'],
  cocina: ['estufa', 'horno', 'microond', 'cocina', 'cocc', 'licuad', 'batidor', 'cafeter', 'tostad', 'freidora', 'air fryer'],
  'tv-audio': ['television', 'televisor', 'tv y audio', 'audio'],
}

function matchesCategory(product: Product, selectedCategory: string): boolean {
  if (product.categoryId === selectedCategory) return true
  const keywords = CATEGORY_KEYWORDS[selectedCategory]
  if (!keywords?.length) return false
  const haystack = `${product.categoryId} ${product.category}`.toLowerCase()
  return keywords.some(keyword => haystack.includes(keyword))
}

// Lives in its own component so useProductReviews only mounts (and only
// fires its fetch) once a row is actually expanded, instead of every
// product in the list fetching reviews up front.
function DesktopReviews({ productId, isLoggedIn, onRequireLogin }: {
  productId: string
  isLoggedIn: boolean
  onRequireLogin: () => void
}) {
  const reviews = useProductReviews(productId)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (rating < 1) return
    setSubmitting(true)
    setError(null)
    try {
      await reviews.submit(rating, comment.trim() || undefined)
      setShowForm(false)
      setRating(0)
      setComment('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la reseña')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '14px 20px', borderTop: '1px solid #F2F4F7' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: '#5d7ea0',
          fontFamily: "'DM Sans', sans-serif",
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          Reseñas {reviews.count > 0 && `(${reviews.count})`}
        </span>
        <button
          onClick={() => (isLoggedIn ? setShowForm(v => !v) : onRequireLogin())}
          style={{
            fontSize: 12, fontWeight: 600, color: '#00B894',
            fontFamily: "'DM Sans', sans-serif",
            background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          Escribir reseña
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                aria-label={`${n} estrella${n === 1 ? '' : 's'}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
              >
                <StarIcon size={18} filled={n <= rating} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="¿Qué te pareció este producto? (opcional)"
            rows={2}
            maxLength={1000}
            style={{
              width: '100%', resize: 'none', boxSizing: 'border-box',
              background: '#fff', border: '1px solid #E8EDF2', borderRadius: 8,
              padding: '8px 10px', fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              color: '#0F1D2D', marginBottom: 8,
            }}
          />
          {error && (
            <div style={{ fontSize: 11, color: '#FF3B3B', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{error}</div>
          )}
          <button
            onClick={submit}
            disabled={submitting || rating < 1}
            style={{
              border: 'none', borderRadius: 8, padding: '7px 14px',
              background: rating < 1 ? '#E8EDF2' : '#00B894',
              color: rating < 1 ? '#9AAABB' : '#fff',
              fontSize: 12, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
              cursor: submitting || rating < 1 ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      )}

      {reviews.reviews.length === 0 ? (
        <p style={{ fontSize: 12, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
          Todavía no hay reseñas para este producto.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.reviews.slice(0, 3).map(review => (
            <div key={review.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0F1D2D', fontFamily: "'DM Sans', sans-serif" }}>
                  {review.userName}
                </span>
                <span style={{ fontSize: 11, color: '#FFD166' }}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
              </div>
              {review.comment && (
                <p style={{ fontSize: 12, color: '#5d7ea0', fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DesktopProductRow({ product, isAlerted, onToggleAlert, isFavorite, onToggleFavorite, isLoggedIn, onRequireLogin }: {
  product: Product
  isAlerted: boolean
  onToggleAlert: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
  isLoggedIn: boolean
  onRequireLogin: () => void
}) {
  const cheapest = product.prices[0]
  const savings = product.prices[product.prices.length - 1].price - cheapest.price
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()

  // Keeps the address bar shareable while browsing: expanding a row points
  // it at that product's real URL (apps/web-seo server-renders a full page
  // there for any direct/fresh hit), without changing anything about how
  // this list itself looks or behaves. replace:true so expand/collapse
  // clicks don't pile up the back button.
  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    if (next) navigate(`/product/${encodeURIComponent(product.slug || product.id)}`, { replace: true })
  }

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
          <ProductImage src={product.image} alt={product.name} />
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
          <button
            onClick={onToggleFavorite}
            aria-label={isFavorite ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
            aria-pressed={isFavorite}
            style={{
              width: 44, height: 44, borderRadius: 10,
              border: '1px solid #E8EDF2',
              background: isFavorite ? '#FFF3E0' : '#F2F4F7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <HeartIcon size={16} filled={isFavorite} />
          </button>
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
          <button
            onClick={() => { if (cheapest.url) window.open(cheapest.url, '_blank', 'noopener,noreferrer') }}
            disabled={!cheapest.url}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              border: 'none', borderRadius: 10,
              background: cheapest.url ? '#00B894' : '#E8EDF2',
              color: cheapest.url ? '#fff' : '#9AAABB',
              padding: '10px 16px', cursor: cheapest.url ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              boxShadow: cheapest.url ? '0 4px 12px rgba(0,184,148,0.25)' : 'none',
            }}
          >
            <CheckIcon size={14} color={cheapest.url ? '#fff' : '#9AAABB'} />
            Ver oferta
          </button>
          <button
            onClick={toggleExpanded}
            aria-label={expanded ? `Ocultar comparación de tiendas para ${product.name}` : `Ver comparación de tiendas para ${product.name}`}
            aria-expanded={expanded}
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
        <>
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
                <StoreLogo store={sp.store} abbr={sp.abbr} color={sp.color} size={32} borderRadius={8} />
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
                <button
                  onClick={() => { if (sp.url) window.open(sp.url, '_blank', 'noopener,noreferrer') }}
                  disabled={!sp.available || !sp.url}
                  style={{
                    border: 'none', borderRadius: 8,
                    background: sp.available && sp.url ? '#00B894' : '#E8EDF2',
                    color: sp.available && sp.url ? '#fff' : '#5d7ea0',
                    padding: '8px 16px', cursor: sp.available && sp.url ? 'pointer' : 'not-allowed',
                    fontSize: 12, fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Ver oferta
                </button>
              </div>
            </div>
          ))}
        </div>
        <DesktopReviews productId={product.id} isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} />
        </>
      )}
    </div>
  )
}

export default function DesktopView({ onMobile, alertedIds, onToggleAlert, favoriteIds, onToggleFavorite, user, onLogout }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [stockOnly, setStockOnly] = useState(false)
  const [freeShippingOnly, setFreeShippingOnly] = useState(false)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100000)
  const [sortBy, setSortBy] = useState<SortKey>('price-asc')
  const [screen, setScreen] = useState<DesktopScreen>('results')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const { products, loading, error } = useCatalogProducts(query)
  const searchHistory = useSearchHistory(user)
  const hasNotifications = getPriceDropNotifications(products, alertedIds).length > 0

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

  const runSearch = (term = query) => {
    if (term !== query) setQuery(term)
    if (term.trim()) void searchHistory.record(term)
    setFocused(false)
    setScreen('results')
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
      const inCategory = !selectedCategory || matchesCategory(p, selectedCategory)
      // p.discount is never set for real ingested products (see
      // getRecentPriceDrop's comment) -- fall back to an actual observed
      // price drop so "Ofertas" isn't permanently empty for real data.
      const isDeal = screen !== 'deals' || p.discount > 0 || getRecentPriceDrop(p) !== null
      const isAlerted = screen !== 'alerts' || alertedIds.has(p.id)
      const inAvailability = p.prices.some(price =>
        (!stockOnly || price.available) && (!freeShippingOnly || price.shipping.toLowerCase().includes('gratis')),
      )
      return inStoreFilter && inPriceRange && inCategory && isDeal && isAlerted && inAvailability
    })

    if (sortBy === 'relevance') return filtered

    const sorted = [...filtered].sort((a, b) => {
      const totalA = getOfferTotal(getBestOffer(a.prices) ?? a.prices[0])
      const totalB = getOfferTotal(getBestOffer(b.prices) ?? b.prices[0])
      return sortBy === 'price-asc' ? totalA - totalB : totalB - totalA
    })
    return sorted
  }, [products, selectedStores, minPrice, maxPrice, sortBy, selectedCategory, screen, alertedIds, stockOnly, freeShippingOnly])

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

  const { page, pageSize, totalPages, total, pageItems, setPage, setPageSize } = usePagination(visibleProducts)

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
            <DondeTaMark size={34} />
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
          <div style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
          <div style={{
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
            <button onClick={() => runSearch()} style={{
              background: '#00B894', border: 'none', borderRadius: 8,
              color: '#fff', padding: '6px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
            }}>
              Buscar
            </button>
          </div>

          {focused && !query.trim() && searchHistory.recent.length > 0 && (
            <div style={{
              position: 'absolute', top: 50, left: 0, right: 0, zIndex: 120,
              background: '#fff', borderRadius: 12,
              border: '1px solid #E8EDF2',
              boxShadow: '0 12px 32px rgba(15,29,45,0.12)',
              padding: 8,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#9AAABB',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '6px 10px',
              }}>
                Búsquedas recientes
              </div>
              {searchHistory.recent.slice(0, 6).map(term => (
                <button
                  key={term}
                  // mousedown (not click/onClick) fires before the input's
                  // onBlur, which otherwise closes this dropdown first and
                  // swallows the click entirely.
                  onMouseDown={() => runSearch(term)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '8px 10px', borderRadius: 8,
                    fontSize: 13, color: '#0F1D2D',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F2F4F7')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {term}
                </button>
              ))}
            </div>
          )}
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
            <button
              onClick={() => setScreen('alerts')}
              aria-label="Alertas"
              style={{
                width: 44, height: 44, borderRadius: 10,
                background: '#F2F4F7', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}
            >
              <BellIcon size={18} color="#5d7ea0" />
              {hasNotifications && (
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#FF3B3B', border: '1.5px solid #fff',
                }} />
              )}
            </button>
            <div style={{ position: 'relative' }}>
              <button
                // Desktop has no profile screen of its own yet, so "not
                // logged in" still routes to the mobile login flow (the
                // only place sign-in actually lives). Logged in, this opens
                // a small account menu instead of doing anything itself —
                // it used to sign out immediately on click, which is too
                // easy to trigger by accident for a one-click action.
                onClick={() => (user ? setShowAccountMenu(v => !v) : onMobile())}
                aria-label={user ? `Cuenta de ${user.name ?? user.email}` : 'Iniciar sesión'}
                title={user ? `Cuenta de ${user.name ?? user.email}` : 'Iniciar sesión'}
                aria-expanded={user ? showAccountMenu : undefined}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  border: 'none', cursor: 'pointer', padding: 0,
                  background: user ? 'linear-gradient(135deg, #00B894, #00cba0)' : '#F2F4F7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {user ? (
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    color: '#fff',
                  }}>
                    {userInitials(user)}
                  </span>
                ) : (
                  <UserIcon size={18} color="#9AAABB" />
                )}
              </button>

              {showAccountMenu && user && (
                <>
                  <div
                    onClick={() => setShowAccountMenu(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 150 }}
                  />
                  <div style={{
                    position: 'absolute', top: 48, right: 0, zIndex: 151,
                    width: 240, background: '#fff', borderRadius: 14,
                    border: '1px solid #E8EDF2',
                    boxShadow: '0 12px 32px rgba(15,29,45,0.14)',
                    padding: 16,
                  }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: '#0F1D2D',
                      fontFamily: "'Poppins', sans-serif", marginBottom: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {user.name ?? user.email}
                    </div>
                    <div style={{
                      fontSize: 12, color: '#5d7ea0', fontFamily: "'DM Sans', sans-serif",
                      marginBottom: 14,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {user.email}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      <div style={{ flex: 1, background: '#F8FAFC', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: '#0F1D2D' }}>
                          {favoriteIds.size}
                        </div>
                        <div style={{ fontSize: 11, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif" }}>Favoritos</div>
                      </div>
                      <div style={{ flex: 1, background: '#F8FAFC', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: '#0F1D2D' }}>
                          {alertedIds.size}
                        </div>
                        <div style={{ fontSize: 11, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif" }}>Alertas</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setShowAccountMenu(false); onLogout() }}
                      style={{
                        width: '100%', border: '1px solid #E8EDF2', borderRadius: 10,
                        background: '#F8FAFC', color: '#FF3B3B',
                        padding: '9px 0', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div style={{
        maxWidth: 1360, margin: '0 auto', padding: '28px 40px', display: 'grid',
        gridTemplateColumns: screen === 'categories' || screen === 'stores' ? '1fr' : '300px 1fr', gap: 24,
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
                  <StoreLogo store={store} abbr={STORE_ABBRS[store]} color={STORE_COLORS[store]} size={44} />
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
            // Real catalogs can push "Tipo de artículo" well past a single
            // viewport's height. Without a bound + its own scroll, a sticky
            // element taller than the viewport just gets its overflow cut
            // off permanently once stuck — page scroll can't reach it,
            // because the element itself never moves once pinned.
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
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
              {([
                { label: 'En stock', checked: stockOnly, toggle: () => setStockOnly(value => !value) },
                { label: 'Con envío gratis', checked: freeShippingOnly, toggle: () => setFreeShippingOnly(value => !value) },
              ] as const).map(({ label, checked, toggle }) => (
                <label key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', minHeight: 44, cursor: 'pointer',
                  borderBottom: '1px solid #F2F4F7',
                }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={toggle}
                    style={{
                      position: 'absolute', width: 1, height: 1, padding: 0,
                      margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0,
                    }}
                  />
                  <div aria-hidden="true" style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${checked ? '#00B894' : '#D8E6F0'}`,
                    background: checked ? '#00B894' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.12s',
                  }}>
                    {checked && <CheckIcon size={10} color="#fff" />}
                  </div>
                  <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#0F1D2D' }}>
                    {label}
                  </span>
                </label>
              ))}
            </div>

            {/* Ad slot -- lives inside the sticky panel itself (not as a
                sibling after it): position: sticky promotes this panel to a
                higher paint layer than static-flow siblings, so a sibling ad
                slot here would render at its pre-scroll flow position and
                get visually covered by the (now-stuck) panel once scrolled,
                never actually becoming visible. */}
            <div style={{ marginTop: 16 }}>
              <AdBanner {...AD_SIZES.mediumRectangle} slot={appConfig.adsenseSlots.mediumRectangle} />
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

          {/* Ad slot */}
          <div style={{ marginBottom: 20 }}>
            <AdBanner {...AD_SIZES.leaderboard} slot={appConfig.adsenseSlots.leaderboard} />
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
            <>
              {pageItems.map(p => (
                <DesktopProductRow
                  key={p.id}
                  product={p}
                  isAlerted={alertedIds.has(p.id)}
                  onToggleAlert={() => onToggleAlert(p.id)}
                  isFavorite={favoriteIds.has(p.id)}
                  onToggleFavorite={() => onToggleFavorite(p.id)}
                  isLoggedIn={Boolean(user)}
                  onRequireLogin={onMobile}
                />
              ))}
              <PaginationControls
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </main>
        </>
        )}
      </div>

      {/* Footer: community + platform availability */}
      <footer style={{
        borderTop: '1px solid #E8EDF2', background: '#fff', marginTop: 40,
        padding: '28px 40px',
      }}>
        <div style={{
          maxWidth: 1360, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20,
        }}>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              textDecoration: 'none', border: '1px solid #E8EDF2', borderRadius: 12,
              padding: '10px 16px',
            }}
          >
            <DiscordIcon size={20} />
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: '#0F1D2D' }}>
              Únete a nuestro Discord
            </span>
          </a>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid #E8EDF2', borderRadius: 12, padding: '10px 14px',
            }}>
              <AndroidIcon size={18} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: '#0F1D2D' }}>Android</div>
                <div style={{ fontSize: 9, color: '#00B894', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Disponible</div>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, opacity: 0.7,
              border: '1px solid #E8EDF2', borderRadius: 12, padding: '10px 14px',
            }}>
              <AppleIcon size={16} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: '#0F1D2D' }}>iOS</div>
                <div style={{ fontSize: 9, color: '#9AAABB', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Próximamente</div>
              </div>
            </div>
          </div>

          <span style={{ fontSize: 12, color: '#B0C4D8', fontFamily: "'DM Sans', sans-serif" }}>
            Hecho en 🇩🇴 RD con ❤️ · DóndeTa v1.0.0
          </span>
        </div>
      </footer>
    </div>
  )
}
