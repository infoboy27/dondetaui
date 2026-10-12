import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES } from '../data/mock'
import { SearchIcon, BellIcon, MicIcon, ChevronRight, ZapIcon } from '../components/Icons'
import AdBanner from '../components/AdBanner'
import ProductCard from '../components/ProductCard'
import { AD_SIZES } from '../data/adSizes'
import { useHomeHighlights } from '../hooks/useCatalogProducts'
import { useCatalogFreshness } from '../hooks/useCatalogFreshness'
import { compareByRelevance, getTopComparisons } from '../domain/offers'
import { getTopPriceDrops } from '../domain/notifications'
import { formatPrice } from '../domain/currency'
import DealCard, { DealCardSkeleton } from '../components/DealCard'
import DiscountCode from '../components/DiscountCode'
import { gamingKind, gamingShowcase } from '../domain/gaming'
import StoreLogo from '../components/StoreLogo'
import { SiteLinks } from '../components/SiteLinks'
import { storesApi, type Store } from '../api/stores'
import { appConfig } from '../config/env'
import type { Product } from '../types'

interface Props {
  onSearch: (q: string) => void
  onProduct: (p: Product) => void
  onCategory: (cat: string) => void
  onNearby?: () => void
  onStore?: (abbr: string) => void
  onViewAll: () => void
  onNotifications?: () => void
  hasNotifications?: boolean
  favoriteIds: Set<string>
  onToggleFavorite: (id: string) => void
}

export default function HomeScreen({
  onSearch, onProduct, onCategory, onNearby, onStore, onViewAll, onNotifications, hasNotifications,
  favoriteIds, onToggleFavorite,
}: Props) {
  const { products, gaming, total, loading, error, retry } = useHomeHighlights()
  const freshness = useCatalogFreshness()
  const comparisons = useMemo(() => getTopComparisons(products, 12), [products])
  const drops = useMemo(() => getTopPriceDrops(products, 12), [products])
  const gamingDeals = useMemo(() => gamingShowcase(gaming), [gaming])
  const featured = useMemo(() => [...products].sort(compareByRelevance).slice(0, 10), [products])
  const [stores, setStores] = useState<Store[]>([])

  useEffect(() => {
    if (!appConfig.useApi) return
    let cancelled = false
    storesApi.list()
      .then(list => { if (!cancelled) setStores([...list].sort((a, b) => b.productCount - a.productCount)) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

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
          <button
            onClick={() => onNotifications?.()}
            aria-label="Notificaciones"
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: '#E6F7F3', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}
          >
            <BellIcon size={20} color="#00B894" />
            {hasNotifications && (
              <span style={{
                position: 'absolute', top: 8, right: 8,
                width: 8, height: 8, borderRadius: '50%',
                background: '#FF3B3B', border: '1.5px solid #fff',
              }} />
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div
          onClick={() => onSearch('')}
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

        {/* Sections, one tap away (they used to sit at the bottom of the page) */}
        <nav aria-label="Secciones" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '14px -20px 0', padding: '0 20px 2px' }}>
          {/* Gaming first while it's new: fifth in line it sat off-screen. */}
          {[...CATEGORIES].sort((a, b) => Number(b.id === 'gaming') - Number(a.id === 'gaming')).map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategory(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                background: cat.color, border: `1.5px solid ${cat.border}33`,
                borderRadius: 999, padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 16 }}>{cat.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: '#0F1D2D' }}>
                {cat.label}
              </span>
              {cat.id === 'gaming' && (
                <span style={{
                  fontSize: 9, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: '#fff',
                  background: '#8B5CF6', borderRadius: 999, padding: '2px 6px', letterSpacing: '0.03em',
                }}>
                  NUEVO
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Value banner: what DóndeTa does, with the live catalog size */}
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
              {total > 0 && stores.length > 0
                ? `Comparamos ${total.toLocaleString('es-DO')} productos en ${stores.length} tiendas`
                : 'Antes de comprar, mira DóndeTa'}
            </div>
            {freshness && (
              <div style={{
                fontSize: 11, color: 'rgba(255,255,255,0.85)',
                fontFamily: "'DM Sans', sans-serif", marginTop: 2,
              }}>
                {freshness}
              </div>
            )}
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginLeft: 12,
          }}>
            <ZapIcon size={24} color="#fff" />
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px 20px 0' }}>
          <div role="alert" style={{
            background: '#FFF3E0', border: '1px solid #FF9F1C', borderRadius: 12,
            padding: '12px 16px', color: '#0F1D2D',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          }}>
            No se pudo cargar el catálogo de precios. Revisa tu conexión e intenta de nuevo.{' '}
            <button
              onClick={retry}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                color: '#00B894', fontWeight: 600, fontFamily: 'inherit', fontSize: 'inherit',
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {loading && (
        <>
          <Section title="Comparaciones del día" subtitle="El mismo producto, más barato en otra tienda">
            <HorizontalRow>{[0, 1, 2].map(i => <DealCardSkeleton key={i} />)}</HorizontalRow>
          </Section>
          <Section title="Bajaron de precio" subtitle="Según nuestro historial de precios">
            <HorizontalRow>{[0, 1, 2].map(i => <DealCardSkeleton key={i} />)}</HorizontalRow>
          </Section>
        </>
      )}

      {/* Comparaciones del día: the product's core promise, shown first */}
      {comparisons.length > 0 && (
        <Section title="Comparaciones del día" subtitle="El mismo producto, más barato en otra tienda" action="Ver todo" onAction={onViewAll}>
          <HorizontalRow>
            {comparisons.map((entry, index) => (
              <DealCard
                key={entry.product.id}
                priority={index === 0}
                product={entry.product}
                onProduct={onProduct}
                storeCount={entry.stores}
                highlight={{ label: `Ahorras ${formatPrice(entry.savings)}` }}
              />
            ))}
          </HorizontalRow>
        </Section>
      )}

      {/* Bajaron de precio */}
      {drops.length > 0 && (
        <Section title="Bajaron de precio" subtitle="Según nuestro historial de precios">
          <HorizontalRow>
            {drops.map(drop => (
              <DealCard
                key={drop.product.id}
                product={drop.product}
                onProduct={onProduct}
                highlight={{ label: `Bajó ${drop.pct}%`, wasPrice: drop.oldPrice }}
              />
            ))}
          </HorizontalRow>
        </Section>
      )}

      {/* Gaming: Eneba top-ups, subscriptions and PC keys (one store, so no comparison) */}
      {gamingDeals.length > 0 && (
        <Section title="🎮 Gaming" subtitle="Recargas y juegos digitales · Entrega inmediata" action="Ver todo" onAction={() => onCategory('gaming')}>
          <div style={{ padding: '0 20px 12px' }}>
            <DiscountCode compact />
          </div>
          <HorizontalRow>
            {gamingDeals.map(product => (
              <DealCard
                key={product.id}
                product={product}
                onProduct={onProduct}
                highlight={{ label: gamingKind(product) }}
              />
            ))}
          </HorizontalRow>
        </Section>
      )}

      {/* Nothing to compare yet (fresh install, fixtures): still show products */}
      {comparisons.length === 0 && drops.length === 0 && featured.length > 0 && (
        <Section title="Destacados" action="Ver todo" onAction={onViewAll}>
          <HorizontalRow>
            {featured.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onProduct={onProduct}
                isFavorite={favoriteIds.has(p.id)}
                onToggleFavorite={() => onToggleFavorite(p.id)}
              />
            ))}
          </HorizontalRow>
        </Section>
      )}

      {/* Stores we compare */}
      {stores.length > 0 && (
        <Section title="Tiendas que comparamos" action="Cerca de ti" onAction={onNearby}>
          <HorizontalRow gap={10}>
            {stores.map(store => (
              <button
                key={store.slug}
                type="button"
                onClick={() => onStore?.(store.abbr)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  background: '#fff', border: '1px solid #E8EDF2', borderRadius: 14,
                  padding: '12px 10px', width: 92, flexShrink: 0, cursor: 'pointer',
                }}
              >
                <StoreLogo store={store.name} abbr={store.abbr} color={store.color} size={44} borderRadius={12} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0F1D2D', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', lineHeight: 1.2 }}>
                  {store.name}
                </span>
                <span style={{ fontSize: 10, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif" }}>
                  {store.productCount.toLocaleString('es-DO')} productos
                </span>
              </button>
            ))}
          </HorizontalRow>
        </Section>
      )}

      {/* Ad slot */}
      <div style={{ padding: '20px 20px 0' }}>
        <AdBanner {...AD_SIZES.mobileBanner} slot={appConfig.adsenseSlots.mobileBanner} />
      </div>

      {/* Whole catalog */}
      <div style={{ padding: '20px 20px 0' }}>
        <button
          type="button"
          onClick={onViewAll}
          style={{
            width: '100%', background: '#fff', border: '1.5px solid #00B894', borderRadius: 14,
            padding: '14px 16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, color: '#00B894',
          }}
        >
          {total > 0 ? `Explorar los ${total.toLocaleString('es-DO')} productos` : 'Explorar todos los productos'}
          <ChevronRight size={16} color="#00B894" />
        </button>
      </div>

      {/* Trust note */}
      <div style={{ padding: '16px 20px 0', textAlign: 'center' }}>
        <span style={{
          fontSize: 11, color: '#B0C4D8',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Precios actualizados a diario · Verifica disponibilidad en la tienda
        </span>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <SiteLinks align="center" />
      </div>
    </div>
  )
}

function Section({ title, subtitle, action, onAction, children }: {
  title: string
  subtitle?: string
  action?: string
  onAction?: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{ padding: '24px 0 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 20px', marginBottom: 12, gap: 12 }}>
        <div>
          <h2 style={{
            fontSize: 17, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            color: '#0F1D2D', margin: 0,
            letterSpacing: '-0.02em',
          }}>
            {title}
          </h2>
          {subtitle && (
            <div style={{ fontSize: 12, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        {action && onAction && (
          <button onClick={onAction} style={{
            fontSize: 13, color: '#00B894', fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap',
          }}>
            {action} <ChevronRight size={14} color="#00B894" />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function HorizontalRow({ children, gap = 14 }: { children: React.ReactNode; gap?: number }) {
  return (
    <div style={{ display: 'flex', gap, padding: '4px 20px 8px', overflowX: 'auto' }}>
      {children}
    </div>
  )
}
