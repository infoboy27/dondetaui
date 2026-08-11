import type { Tab } from '../types'
import { HomeIcon, SearchIcon, CameraIcon, BellIcon, UserIcon } from './Icons'

interface BottomNavProps {
  active: Tab
  onNavigate: (tab: Tab) => void
  alertCount: number
}

const tabs: { id: Tab; label: string; Icon: React.ComponentType<any> }[] = [
  { id: 'home', label: 'Inicio', Icon: HomeIcon },
  { id: 'search', label: 'Buscar', Icon: SearchIcon },
  { id: 'scanner', label: 'Escanear', Icon: CameraIcon },
  { id: 'alerts', label: 'Alertas', Icon: BellIcon },
  { id: 'profile', label: 'Perfil', Icon: UserIcon },
]

export default function BottomNav({ active, onNavigate, alertCount }: BottomNavProps) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        background: '#fff',
        borderTop: '1px solid #E8EDF2',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        zIndex: 100,
        boxShadow: '0 -4px 16px rgba(15,29,45,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch', height: 64 }}>
        {tabs.map((tab, i) => {
          const isCenter = i === 2
          const isActive = active === tab.id

          if (isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingTop: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: isActive ? '#009b7d' : '#00B894',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: -20,
                    boxShadow: '0 4px 16px rgba(0,184,148,0.4)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <tab.Icon size={22} color="#fff" />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    color: isActive ? '#00B894' : '#9AAABB',
                    marginTop: 2,
                  }}
                >
                  {tab.label}
                </span>
              </button>
            )
          }

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'opacity 0.15s ease',
              }}
            >
              <div style={{ position: 'relative' }}>
                <tab.Icon size={22} color={isActive ? '#00B894' : '#9AAABB'} />
                {tab.id === 'alerts' && alertCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -6,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#FF3B3B',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px solid #fff',
                    }}
                  >
                    {alertCount}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#00B894' : '#9AAABB',
                  letterSpacing: '-0.01em',
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 24,
                    height: 3,
                    borderRadius: 2,
                    background: '#00B894',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
