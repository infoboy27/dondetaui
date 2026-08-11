import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { Tab } from './types'
import type { Product } from './types'
import { PRODUCTS } from './data/mock'
import { appConfig } from './config/env'
import { productsApi } from './api/products'
import { getPriceDropNotifications } from './domain/notifications'
import { useCatalogProducts } from './hooks/useCatalogProducts'
import { useAuth } from './hooks/useAuth'
import { usePriceAlerts } from './hooks/usePriceAlerts'
import { useFavorites } from './hooks/useFavorites'
import { useSearchHistory } from './hooks/useSearchHistory'
import BottomNav from './components/BottomNav'
import HomeScreen from './screens/HomeScreen'
import SearchScreen from './screens/SearchScreen'
import ResultsScreen from './screens/ResultsScreen'
import ProductDetailScreen from './screens/ProductDetailScreen'
import ScannerScreen from './screens/ScannerScreen'
import AlertsScreen from './screens/AlertsScreen'
import ProfileScreen from './screens/ProfileScreen'
import DesktopView from './screens/DesktopView'
import StoreDetailScreen from './screens/StoreDetailScreen'
import NearbyStoresScreen from './screens/NearbyStoresScreen'
import EquipaHogarScreen from './screens/EquipaHogarScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import LoginScreen from './screens/LoginScreen'

function pathToTab(pathname: string): Tab | null {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/search') || pathname.startsWith('/results')) return 'search'
  if (pathname.startsWith('/scanner')) return 'scanner'
  if (pathname.startsWith('/alerts')) return 'alerts'
  if (pathname.startsWith('/profile')) return 'profile'
  return null
}

interface ProductRouteProps {
  catalogProducts: Product[]
  favoriteIds: Set<string>
  onToggleFavorite: (id: string) => void
  onCreateAlert: (productId: string, targetPrice?: number) => Promise<void>
  isLoggedIn: boolean
  onRequireLogin: () => void
}

// `/product/:slug` needs to work both for in-app navigation (product is
// already loaded — handed over via router `state`) and for a direct hit
// (shared link, refresh, search-engine crawl) where nothing is loaded yet
// and the product has to be fetched by its slug.
function ProductRoute({ catalogProducts, favoriteIds, onToggleFavorite, onCreateAlert, isLoggedIn, onRequireLogin }: ProductRouteProps) {
  const { slug = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const stateProduct = (location.state as { product?: Product } | null)?.product ?? null
  const [product, setProduct] = useState<Product | null>(
    () => stateProduct ?? catalogProducts.find(p => (p.slug || p.id) === slug) ?? null,
  )
  const [loading, setLoading] = useState(!product)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (product) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)

    const fetcher = appConfig.useApi
      ? productsApi.getBySlug(slug)
      : Promise.resolve(PRODUCTS.find(p => (p.slug || p.id) === slug) ?? null)

    fetcher
      .then(found => {
        if (cancelled) return
        if (found) setProduct(found)
        else setNotFound(true)
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (loading) {
    return (
      <div style={{
        minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9AAABB', fontFamily: "'DM Sans', sans-serif", fontSize: 14,
      }}>
        Cargando producto…
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div style={{
        minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: 24, textAlign: 'center',
      }}>
        <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16, color: '#0F1D2D' }}>
          Producto no encontrado
        </span>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#00B894', color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <ProductDetailScreen
      product={product}
      onBack={() => navigate(-1)}
      isFavorite={favoriteIds.has(product.id)}
      onToggleFavorite={() => onToggleFavorite(product.id)}
      onCreateAlert={targetPrice => onCreateAlert(product.id, targetPrice)}
      isLoggedIn={isLoggedIn}
      onRequireLogin={onRequireLogin}
    />
  )
}

const GUEST_FAVORITES_KEY = 'dondeta_guest_favorites'

function readGuestFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(GUEST_FAVORITES_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch { /* ignore malformed/unavailable storage */ }
  return new Set(PRODUCTS.filter(p => p.favorite).map(p => p.id))
}

export default function App() {
  const [isMobileView, setIsMobileView] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  // Guest favorites persist in localStorage until the guest logs in, at which
  // point they're merged into the account's real favorites (see the effect
  // below) — logged-in favorites come from the backend instead, see favoriteIds.
  const [localFavoriteIds, setLocalFavoriteIds] = useState<Set<string>>(readGuestFavorites)
  const { products: catalogProducts } = useCatalogProducts()
  const { user, loading: authLoading, error: authError, login, register, logout } = useAuth()
  const priceAlerts = usePriceAlerts(user)
  const favorites = useFavorites(user)
  const favoriteIds = user ? new Set(favorites.favorites.map(f => f.productId)) : localFavoriteIds
  const searchHistory = useSearchHistory(user)
  const alertedIds = new Set(priceAlerts.alerts.map(a => a.productId))
  const hasNotifications = getPriceDropNotifications(catalogProducts, alertedIds).length > 0

  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>(() => pathToTab(location.pathname) ?? 'home')

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (user) return
    try {
      localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify([...localFavoriteIds]))
    } catch { /* storage unavailable (private browsing, quota) — guest favorites just won't persist */ }
  }, [user, localFavoriteIds])

  // Merge favorites collected while browsing as a guest into the account the
  // moment login/register succeeds, then clear the local copy so it doesn't
  // linger and get merged again next time this browser logs into some other account.
  useEffect(() => {
    if (!user || localFavoriteIds.size === 0) return
    const idsToMerge = [...localFavoriteIds]
    setLocalFavoriteIds(new Set())
    try {
      localStorage.removeItem(GUEST_FAVORITES_KEY)
    } catch { /* ignore */ }
    for (const id of idsToMerge) void favorites.create(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    const tab = pathToTab(location.pathname)
    if (tab) setActiveTab(tab)
  }, [location.pathname])

  useEffect(() => {
    // gtag.js is injected by vite.config.ts's figma-site-configuration plugin
    // only when .figma/make/site.json sets analytics.googleAnalyticsId — a
    // no-op until that's configured. Its own initial `gtag('config', ...)`
    // call only fires once per real page load, so this SPA still needs its
    // own page_view event per route change or GA would see one pageview for
    // the entire session.
    window.gtag?.('event', 'page_view', { page_path: location.pathname })
  }, [location.pathname])

  // Preserves the deep-link's own history entry: hitting the app fresh
  // (shared link, new tab) has no in-app "back" to go to, so fall back home
  // instead of leaving the SPA via the browser's real previous page.
  const goBack = () => {
    if (location.key === 'default') navigate('/')
    else navigate(-1)
  }

  const handleTab = (tab: Tab) => {
    const pathMap: Record<Tab, string> = {
      home: '/', search: '/search', scanner: '/scanner', alerts: '/alerts', profile: '/profile',
    }
    navigate(pathMap[tab])
  }

  const handleSearch = (q: string) => {
    void searchHistory.record(q)
    navigate(`/results?q=${encodeURIComponent(q)}`)
  }

  const handleProduct = (p: Product) => {
    navigate(`/product/${encodeURIComponent(p.slug || p.id)}`, { state: { product: p } })
  }

  const handleCategory = (catId: string) => {
    navigate(`/results?q=${encodeURIComponent(catId)}`)
  }

  const toggleFavorite = (id: string) => {
    if (user) {
      if (favoriteIds.has(id)) void favorites.remove(id)
      else void favorites.create(id)
      return
    }
    setLocalFavoriteIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openFavorites = () => navigate('/alerts?tab=favoritos')
  const openAlerts = () => navigate('/alerts')

  const handleCreateAlert = async (productId: string, targetPrice?: number) => {
    if (!user) {
      navigate('/login')
      throw new Error('Inicia sesión para crear una alerta')
    }
    await priceAlerts.create(productId, targetPrice)
  }

  const handleToggleDesktopAlert = (productId: string) => {
    if (!user) {
      setIsMobileView(true)
      return
    }
    if (alertedIds.has(productId)) {
      void priceAlerts.remove(productId)
    } else {
      void priceAlerts.create(productId)
    }
  }

  // Desktop view
  if (isDesktop && !isMobileView) {
    return (
      <DesktopView
        onMobile={() => setIsMobileView(true)}
        alertedIds={alertedIds}
        onToggleAlert={handleToggleDesktopAlert}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        user={user}
        onLogout={logout}
      />
    )
  }

  const isScanner = location.pathname === '/scanner'

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#E8EDF2',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: isDesktop ? '24px 0' : 0,
    }}>
      {/* Phone frame on desktop */}
      {isDesktop && (
        <div style={{
          position: 'fixed', top: 24, left: 40,
          display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200,
        }}>
          <button
            onClick={() => setIsMobileView(false)}
            style={{
              background: '#fff', border: '1px solid #E8EDF2',
              borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
              fontSize: 12, color: '#5d7ea0', fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
            }}
          >
            ← Vista escritorio
          </button>
        </div>
      )}

      <div style={{
        width: '100%',
        maxWidth: isDesktop ? 430 : '100%',
        minHeight: isDesktop ? 844 : '100vh',
        maxHeight: isDesktop ? 844 : 'none',
        background: '#F2F4F7',
        borderRadius: isDesktop ? 44 : 0,
        overflow: 'hidden',
        position: 'relative',
        // Without this, `position: fixed` descendants (BottomNav, ProductDetailScreen's
        // CTA bar) anchor to the real browser viewport instead of this phone-frame box —
        // `contain: layout` makes this element a containing block for them too, so they
        // stay pinned to the mockup instead of the actual window edge on desktop.
        contain: isDesktop ? 'layout' : undefined,
        boxShadow: isDesktop ? '0 24px 64px rgba(15,29,45,0.25), 0 0 0 12px #1a2a3a' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Status bar simulation on desktop */}
        {isDesktop && (
          <div style={{
            height: 44, background: isScanner ? '#0A1628' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', flexShrink: 0,
            transition: 'background 0.3s',
          }}>
            <span style={{
              fontSize: 13, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              color: isScanner ? '#fff' : '#0F1D2D',
            }}>
              9:41
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                {[3, 5, 7, 9].map((h, i) => (
                  <div key={i} style={{
                    width: 3, height: h,
                    background: isScanner ? '#fff' : '#0F1D2D',
                    borderRadius: 1, opacity: i === 3 ? 1 : 0.5,
                  }} />
                ))}
              </div>
              <svg width="16" height="12" viewBox="0 0 16 12">
                <rect x="0" y="1" width="14" height="10" rx="2" fill="none" stroke={isScanner ? '#fff' : '#0F1D2D'} strokeWidth="1.2" />
                <rect x="14.5" y="4" width="1.5" height="4" rx="0.75" fill={isScanner ? '#fff' : '#0F1D2D'} />
                <rect x="1.5" y="2.5" width="10" height="7" rx="1" fill={isScanner ? '#fff' : '#0F1D2D'} />
              </svg>
            </div>
          </div>
        )}

        {/* Screen content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
          <Routes>
            <Route
              path="/"
              element={(
                <HomeScreen
                  onSearch={() => navigate('/search')}
                  onProduct={handleProduct}
                  onCategory={handleCategory}
                  onEquipa={() => navigate('/equipa')}
                  onNearby={() => navigate('/stores/nearby')}
                  onNotifications={() => navigate('/notifications')}
                  hasNotifications={hasNotifications}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                />
              )}
            />
            <Route
              path="/search"
              element={(
                <SearchScreen
                  onSearch={handleSearch}
                  recentSearches={searchHistory.recent}
                  onClearRecent={() => void searchHistory.clear()}
                />
              )}
            />
            <Route
              path="/results"
              element={(
                <ResultsScreen
                  query={searchParams.get('q') ?? ''}
                  onBack={goBack}
                  onProduct={handleProduct}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                />
              )}
            />
            <Route
              path="/product/:slug"
              element={(
                <ProductRoute
                  catalogProducts={catalogProducts}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                  onCreateAlert={handleCreateAlert}
                  isLoggedIn={Boolean(user)}
                  onRequireLogin={() => navigate('/login')}
                />
              )}
            />
            <Route path="/scanner" element={<ScannerScreen onBack={goBack} onProduct={handleProduct} />} />
            <Route
              path="/alerts"
              element={(
                <AlertsScreen
                  onProduct={handleProduct}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                  alerts={priceAlerts.alerts}
                  onRemoveAlert={id => void priceAlerts.remove(id)}
                  initialTab={searchParams.get('tab') === 'favoritos' ? 'favoritos' : 'alertas'}
                />
              )}
            />
            <Route
              path="/profile"
              element={(
                <ProfileScreen
                  user={user}
                  favoriteCount={favoriteIds.size}
                  alertCount={alertedIds.size}
                  onFavorites={openFavorites}
                  onAlerts={openAlerts}
                  onLogin={() => navigate('/login')}
                  onLogout={logout}
                />
              )}
            />
            <Route path="/stores/nearby" element={<NearbyStoresScreen onBack={goBack} onStore={abbr => navigate(`/stores/${abbr}`)} />} />
            <Route path="/stores/:abbr" element={<StoreDetailRoute onBack={goBack} onProduct={handleProduct} />} />
            <Route path="/equipa" element={<EquipaHogarScreen onBack={goBack} />} />
            <Route path="/notifications" element={<NotificationsScreen alertedIds={alertedIds} onBack={goBack} onProduct={handleProduct} />} />
            <Route
              path="/login"
              element={(
                <LoginScreen
                  onBack={goBack}
                  onLogin={login}
                  onRegister={register}
                  loading={authLoading}
                  error={authError}
                />
              )}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Bottom nav */}
        {!isScanner && (
          <BottomNav
            active={activeTab}
            onNavigate={handleTab}
            alertCount={alertedIds.size}
          />
        )}
      </div>
    </div>
  )
}

function StoreDetailRoute({ onBack, onProduct }: { onBack: () => void; onProduct: (p: Product) => void }) {
  const { abbr = null } = useParams()
  return <StoreDetailScreen storeAbbr={abbr} onBack={onBack} onProduct={onProduct} />
}
