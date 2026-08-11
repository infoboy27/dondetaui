import { useState, useEffect } from 'react'
import type { Screen, Tab } from './types'
import type { Product } from './types'
import { PRODUCTS } from './data/mock'
import { getPriceDropNotifications } from './domain/notifications'
import { useCatalogProducts } from './hooks/useCatalogProducts'
import { useAuth } from './hooks/useAuth'
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

export default function App() {
  const [isMobileView, setIsMobileView] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  const [screen, setScreen] = useState<Screen>('home')
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedStoreAbbr, setSelectedStoreAbbr] = useState<string | null>(null)
  const [history, setHistory] = useState<Screen[]>(['home'])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set(PRODUCTS.filter(p => p.favorite).map(p => p.id)),
  )
  const [alertsTab, setAlertsTab] = useState<'alertas' | 'favoritos'>('alertas')
  const [alertedIds, setAlertedIds] = useState<Set<string>>(
    () => new Set(PRODUCTS.filter(p => p.alerted).map(p => p.id)),
  )
  const { products: catalogProducts } = useCatalogProducts()
  const hasNotifications = getPriceDropNotifications(catalogProducts, alertedIds).length > 0
  const { user, loading: authLoading, error: authError, login, register, logout } = useAuth()

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const navigate = (s: Screen, product?: Product) => {
    setHistory(prev => [...prev, s])
    setScreen(s)
    if (product) setSelectedProduct(product)
    if (s === 'home') setActiveTab('home')
    else if (s === 'search') setActiveTab('search')
    else if (s === 'scanner') setActiveTab('scanner')
    else if (s === 'alerts') setActiveTab('alerts')
    else if (s === 'profile') setActiveTab('profile')
  }

  const goBack = () => {
    const prev = history[history.length - 2] ?? 'home'
    setHistory(h => h.slice(0, -1))
    setScreen(prev)
  }

  const handleTab = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'alerts') setAlertsTab('alertas')
    const screenMap: Record<Tab, Screen> = {
      home: 'home',
      search: 'search',
      scanner: 'scanner',
      alerts: 'alerts',
      profile: 'profile',
    }
    navigate(screenMap[tab])
  }

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    navigate('results')
  }

  const handleProduct = (p: Product) => {
    setSelectedProduct(p)
    navigate('product', p)
  }

  const handleCategory = (catId: string) => {
    setSearchQuery(catId)
    navigate('results')
  }

  const toggleFavorite = (id: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openFavorites = () => {
    setAlertsTab('favoritos')
    navigate('alerts')
  }

  const openAlerts = () => {
    setAlertsTab('alertas')
    navigate('alerts')
  }

  const addAlert = (id: string) => {
    setAlertedIds(prev => new Set(prev).add(id))
  }

  const toggleAlert = (id: string) => {
    setAlertedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Desktop view
  if (isDesktop && !isMobileView) {
    return <DesktopView onMobile={() => setIsMobileView(true)} alertedIds={alertedIds} onToggleAlert={toggleAlert} user={user} />
  }

  const isScanner = screen === 'scanner'

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
          {screen === 'home' && (
            <HomeScreen
              onSearch={q => { setSearchQuery(q); navigate('search') }}
              onProduct={handleProduct}
              onCategory={handleCategory}
              onEquipa={() => navigate('equipa')}
              onNearby={() => navigate('nearby')}
              onNotifications={() => navigate('notifications')}
              hasNotifications={hasNotifications}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
            />
          )}
          {screen === 'search' && (
            <SearchScreen onSearch={handleSearch} />
          )}
          {screen === 'results' && (
            <ResultsScreen
              query={searchQuery}
              onBack={goBack}
              onProduct={handleProduct}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
            />
          )}
          {screen === 'product' && selectedProduct && (
            <ProductDetailScreen
              product={selectedProduct}
              onBack={goBack}
              isFavorite={favoriteIds.has(selectedProduct.id)}
              onToggleFavorite={() => toggleFavorite(selectedProduct.id)}
              onCreateAlert={() => addAlert(selectedProduct.id)}
            />
          )}
          {screen === 'scanner' && (
            <ScannerScreen onBack={goBack} onProduct={handleProduct} />
          )}
          {screen === 'alerts' && (
            <AlertsScreen
              onProduct={handleProduct}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              initialTab={alertsTab}
            />
          )}
          {screen === 'profile' && (
            <ProfileScreen
              user={user}
              favoriteCount={favoriteIds.size}
              alertCount={alertedIds.size}
              onFavorites={openFavorites}
              onAlerts={openAlerts}
              onLogin={() => navigate('login')}
              onLogout={logout}
            />
          )}
          {screen === 'store' && (
            <StoreDetailScreen storeAbbr={selectedStoreAbbr} onBack={goBack} onProduct={handleProduct} />
          )}
          {screen === 'nearby' && (
            <NearbyStoresScreen
              onBack={goBack}
              onStore={abbr => { setSelectedStoreAbbr(abbr); navigate('store') }}
            />
          )}
          {screen === 'equipa' && (
            <EquipaHogarScreen onBack={goBack} />
          )}
          {screen === 'notifications' && (
            <NotificationsScreen alertedIds={alertedIds} onBack={goBack} onProduct={handleProduct} />
          )}
          {screen === 'login' && (
            <LoginScreen
              onBack={goBack}
              onLogin={login}
              onRegister={register}
              loading={authLoading}
              error={authError}
            />
          )}
        </div>

        {/* Bottom nav */}
        {screen !== 'scanner' && (
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
