import { useMemo, useState } from 'react'
import ProductComparisonCard from '../components/ProductComparisonCard'
import SectionHeader from '../components/SectionHeader'
import { matchesSectionFilter } from '../domain/sections'
import PaginationControls from '../components/PaginationControls'
import { ChevronLeft, FilterIcon } from '../components/Icons'
import { CATEGORIES } from '../data/mock'
import { matchesCategory } from '../domain/categories'
import { compareByRelevance, getBestOffer, getOfferTotal } from '../domain/offers'
import { useCatalogProducts } from '../hooks/useCatalogProducts'
import { usePagination } from '../hooks/usePagination'
import type { Product } from '../types'

interface Props {
  query: string
  // A curated category id (Home screen's quick-filter buttons), distinct
  // from a free-text search: it's matched against real category data via
  // matchesCategory (src/domain/categories.ts) instead of being sent to the
  // search API as literal text -- "muebles" or "electrodomesticos" (no
  // accent) essentially never appears as a substring in real product names,
  // so treating it as a search query silently returned zero/wrong results.
  category?: string
  onBack: () => void
  onProduct: (p: Product) => void
  favoriteIds: Set<string>
  onToggleFavorite: (id: string) => void
}

export default function ResultsScreen({ query, category, onBack, onProduct, favoriteIds, onToggleFavorite }: Props) {
  const [sortBy, setSortBy] = useState<'precio' | 'relevancia'>('relevancia')
  const [showFilters, setShowFilters] = useState(false)
  // Stores the user switched off. The chips come from the stores actually in
  // the results -- a hardcoded list ("Corripio" vs the real "Tiendas Corripio",
  // nothing for Colombia/México) silently filtered whole stores out.
  const [excludedStores, setExcludedStores] = useState<string[]>([])
  const [stockOnly, setStockOnly] = useState(false)
  const [freeShippingOnly, setFreeShippingOnly] = useState(false)
  // Quick filter from the section header (a product type, or a Gaming kind).
  const [sectionFilter, setSectionFilter] = useState<string | null>(null)
  // Category mode fetches the whole catalog (matchesCategory filters
  // client-side, same as DesktopView) rather than sending the category id
  // to the free-text search API.
  const { products, source, error, retry } = useCatalogProducts(category ? '' : query)
  const categoryLabel = category ? CATEGORIES.find(c => c.id === category)?.label : undefined
  const headingText = categoryLabel || query || 'Todos los productos'
  const sectionProducts = useMemo(
    () => (category ? products.filter(product => matchesCategory(product, category)) : []),
    [products, category],
  )

  const storeOptions = useMemo(
    () => [...new Set(products.flatMap(product => product.prices.map(offer => offer.store)))].sort((a, b) => a.localeCompare(b)),
    [products],
  )
  const isStoreSelected = (store: string) => !excludedStores.includes(store)

  const displayResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const filtered = products.filter(product => {
      // The API already matched the query (name, brand, model, EAN); filtering
      // again by name here dropped model-code searches. Fixtures still need it.
      const matchesQuery = category
        ? matchesCategory(product, category)
        : !normalizedQuery || source === 'api' ||
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.category.toLowerCase().includes(normalizedQuery) ||
          product.brand.toLowerCase().includes(normalizedQuery) ||
          normalizedQuery.includes(product.brand.toLowerCase())

      if (!matchesQuery || !matchesSectionFilter(product, sectionFilter)) return false

      return product.prices.some(offer => {
        const storeMatches = !excludedStores.includes(offer.store)
        const stockMatches = !stockOnly || offer.available
        const shippingMatches = !freeShippingOnly || offer.shipping.toLowerCase().includes('gratis')

        return storeMatches && stockMatches && shippingMatches
      })
    })

    if (sortBy === 'relevancia') return [...filtered].sort(compareByRelevance)

    return [...filtered].sort((a, b) => {
      const aOffer = getBestOffer(a.prices.filter(offer => !excludedStores.includes(offer.store)))
      const bOffer = getBestOffer(b.prices.filter(offer => !excludedStores.includes(offer.store)))

      if (!aOffer && !bOffer) return 0
      if (!aOffer) return 1
      if (!bOffer) return -1

      return getOfferTotal(aOffer) - getOfferTotal(bOffer)
    })
  }, [products, source, query, category, sectionFilter, excludedStores, stockOnly, freeShippingOnly, sortBy])

  const { page, pageSize, totalPages, total, pageItems, setPage, setPageSize } = usePagination(displayResults)

  const toggleStore = (store: string) => {
    setExcludedStores(current => {
      if (current.includes(store)) return current.filter(value => value !== store)
      // Keep at least one store switched on.
      return current.length + 1 >= storeOptions.length ? current : [...current, store]
    })
  }

  return (
    <>
      <title>{headingText === 'Todos los productos' ? 'Resultados | DóndeTa' : `${headingText} — Resultados | DóndeTa`}</title>
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
          <div style={{
            flex: 1, background: '#F2F4F7',
            borderRadius: 12, padding: '10px 14px',
            fontSize: 14, color: '#0F1D2D',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
          }}>
            {headingText}
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
              type="button"
              onClick={() => setShowFilters(value => !value)}
              aria-expanded={showFilters}
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
              type="button"
              onClick={() => setSortBy(value => value === 'precio' ? 'relevancia' : 'precio')}
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
              {sortBy === 'precio' ? 'Precio ↑' : 'Relevancia'}
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
              {storeOptions.map(store => {
                const selected = isStoreSelected(store)
                return (
                  <button
                    type="button"
                    key={store}
                    onClick={() => toggleStore(store)}
                    aria-pressed={selected}
                    style={{
                      background: selected ? '#E6F7F3' : '#F2F4F7',
                      border: `1px solid ${selected ? '#00B894' : '#E8EDF2'}`,
                      borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
                      fontSize: 12, color: selected ? '#00B894' : '#5d7ea0', fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {store}
                  </button>
                )
              })}
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
              <button
                type="button"
                onClick={() => setStockOnly(value => !value)}
                aria-pressed={stockOnly}
                style={{
                  background: stockOnly ? '#E6F7F3' : '#F2F4F7',
                  border: `1px solid ${stockOnly ? '#00B894' : '#E8EDF2'}`,
                  borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
                  fontSize: 12, color: stockOnly ? '#00B894' : '#5d7ea0', fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                En stock
              </button>
              <button
                type="button"
                onClick={() => setFreeShippingOnly(value => !value)}
                aria-pressed={freeShippingOnly}
                style={{
                  background: freeShippingOnly ? '#E6F7F3' : '#F2F4F7',
                  border: `1px solid ${freeShippingOnly ? '#00B894' : '#E8EDF2'}`,
                  borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
                  fontSize: 12, color: freeShippingOnly ? '#00B894' : '#5d7ea0', fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Con envío gratis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{ padding: '16px 16px 0' }}>
        {category && sectionProducts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <SectionHeader category={category} products={sectionProducts} selected={sectionFilter} onSelect={setSectionFilter} />
          </div>
        )}
        {displayResults.length > 0 ? pageItems.map(product => (
          <ProductComparisonCard
            key={product.id}
            product={product}
            onProduct={onProduct}
            isFavorite={favoriteIds.has(product.id)}
            onToggleFavorite={() => onToggleFavorite(product.id)}
          />
        )) : (
          <div style={{
            background: '#fff', border: '1px solid #E8EDF2', borderRadius: 16,
            padding: '28px 20px', textAlign: 'center',
            fontFamily: "'DM Sans', sans-serif", color: '#5d7ea0', fontSize: 13,
          }}>
            {error ? (
              <>
                No se pudo cargar el catálogo de precios.{' '}
                <button
                  onClick={retry}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: '#00B894', fontWeight: 600, fontFamily: 'inherit', fontSize: 'inherit',
                  }}
                >
                  Reintentar
                </button>
              </>
            ) : 'No encontramos productos con esos filtros.'}
          </div>
        )}
        <PaginationControls
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
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
    </>
  )
}