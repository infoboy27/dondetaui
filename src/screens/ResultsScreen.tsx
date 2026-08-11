import { useMemo, useState } from 'react'
import ProductComparisonCard from '../components/ProductComparisonCard'
import PaginationControls from '../components/PaginationControls'
import { ChevronLeft, FilterIcon } from '../components/Icons'
import { getBestOffer, getOfferTotal } from '../domain/offers'
import { useCatalogProducts } from '../hooks/useCatalogProducts'
import { usePagination } from '../hooks/usePagination'
import type { Product } from '../types'

interface Props {
  query: string
  onBack: () => void
  onProduct: (p: Product) => void
  favoriteIds: Set<string>
  onToggleFavorite: (id: string) => void
}

const STORE_FILTERS = ['Plaza Lama', 'Sirena', 'Corripio', 'Jumbo', 'PriceSmart']

export default function ResultsScreen({ query, onBack, onProduct, favoriteIds, onToggleFavorite }: Props) {
  const [sortBy, setSortBy] = useState<'precio' | 'relevancia'>('precio')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStores, setSelectedStores] = useState<string[]>(STORE_FILTERS)
  const [stockOnly, setStockOnly] = useState(false)
  const [freeShippingOnly, setFreeShippingOnly] = useState(false)
  const { products } = useCatalogProducts(query)

  const displayResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const filtered = products.filter(product => {
      const matchesQuery = !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(product.brand.toLowerCase())

      if (!matchesQuery) return false

      return product.prices.some(offer => {
        const storeMatches = selectedStores.includes(offer.store)
        const stockMatches = !stockOnly || offer.available
        const shippingMatches = !freeShippingOnly || offer.shipping.toLowerCase().includes('gratis')

        return storeMatches && stockMatches && shippingMatches
      })
    })

    if (sortBy === 'relevancia') return filtered

    return [...filtered].sort((a, b) => {
      const aOffer = getBestOffer(a.prices.filter(offer => selectedStores.includes(offer.store)))
      const bOffer = getBestOffer(b.prices.filter(offer => selectedStores.includes(offer.store)))

      if (!aOffer && !bOffer) return 0
      if (!aOffer) return 1
      if (!bOffer) return -1

      return getOfferTotal(aOffer) - getOfferTotal(bOffer)
    })
  }, [products, query, selectedStores, stockOnly, freeShippingOnly, sortBy])

  const { page, pageSize, totalPages, total, pageItems, setPage, setPageSize } = usePagination(displayResults)

  const toggleStore = (store: string) => {
    setSelectedStores(current => {
      if (current.includes(store)) {
        return current.length === 1 ? current : current.filter(value => value !== store)
      }

      return [...current, store]
    })
  }

  return (
    <>
      <title>{query ? `${query} — Resultados | DóndeTa` : 'Resultados | DóndeTa'}</title>
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
            {query || 'Todos los productos'}
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
              {STORE_FILTERS.map(store => {
                const selected = selectedStores.includes(store)
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
            No encontramos productos con esos filtros.
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