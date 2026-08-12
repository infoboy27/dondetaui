import { BellIcon, HeartIcon, ShieldIcon, HelpCircleIcon, LogOutIcon, ChevronRight, SettingsIcon, UserIcon, DiscordIcon, InstagramIcon, AndroidIcon, AppleIcon } from '../components/Icons'

const DISCORD_INVITE_URL = 'https://discord.gg/sxcSngrTZv'
const INSTAGRAM_URL = 'https://www.instagram.com/dondetard'
import { userInitials } from '../domain/user'
import type { User } from '../types'

interface Props {
  user: User | null
  favoriteCount: number
  alertCount: number
  onFavorites: () => void
  onAlerts: () => void
  onLogin: () => void
  onLogout: () => void
}

export default function ProfileScreen({ user, favoriteCount, alertCount, onFavorites, onAlerts, onLogin, onLogout }: Props) {
  const MENU_SECTIONS = [
    {
      title: 'Mi cuenta',
      items: [
        {
          icon: HeartIcon,
          label: 'Productos guardados',
          value: favoriteCount === 1 ? '1 favorito' : `${favoriteCount} favoritos`,
          accent: false,
          onClick: onFavorites,
        },
        {
          icon: BellIcon,
          label: 'Mis alertas de precio',
          value: alertCount === 1 ? '1 activa' : `${alertCount} activas`,
          accent: false,
          onClick: onAlerts,
        },
      ],
    },
    {
      title: 'Preferencias',
      items: [
        { icon: SettingsIcon, label: 'Notificaciones', value: 'Activas', accent: false },
        { icon: SettingsIcon, label: 'Moneda', value: 'DOP (RD$)', accent: false },
      ],
    },
    {
      title: 'Soporte',
      items: [
        { icon: HelpCircleIcon, label: 'Ayuda y soporte', value: '', accent: false },
        { icon: ShieldIcon, label: 'Privacidad y seguridad', value: '', accent: false },
        { icon: HelpCircleIcon, label: 'Acerca de DóndeTa', value: 'v1.0.0', accent: false },
      ],
    },
    ...(user
      ? [{
          title: '',
          items: [{ icon: LogOutIcon, label: 'Cerrar sesión', value: '', accent: true, onClick: onLogout }],
        }]
      : []),
  ]

  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '20px 20px 24px',
        borderBottom: '1px solid #E8EDF2',
      }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700,
          fontFamily: "'Poppins', sans-serif",
          color: '#0F1D2D', margin: '0 0 20px',
          letterSpacing: '-0.03em',
        }}>
          Mi perfil
        </h1>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00B894 0%, #00cba0 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,184,148,0.25)',
            }}>
              <span style={{
                fontSize: 24, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#fff',
              }}>
                {userInitials(user)}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 18, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D', marginBottom: 2,
                letterSpacing: '-0.02em',
              }}>
                {user.name ?? user.email}
              </div>
              <div style={{
                fontSize: 13, color: '#9AAABB',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {user.email}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#F2F4F7', border: '1.5px solid #E8EDF2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <UserIcon size={28} color="#9AAABB" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 14, color: '#5d7ea0',
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: 10, lineHeight: 1.4,
              }}>
                Inicia sesión para guardar tus favoritos y alertas.
              </div>
              <button
                onClick={onLogin}
                style={{
                  background: '#00B894', border: 'none', borderRadius: 10,
                  padding: '9px 16px', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Menu sections */}
      <div style={{ padding: '16px 16px 0' }}>
        {MENU_SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom: 16 }}>
            {section.title && (
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#9AAABB',
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginBottom: 8, paddingLeft: 4,
              }}>
                {section.title}
              </div>
            )}
            <div style={{
              background: '#fff', borderRadius: 16,
              border: '1px solid #E8EDF2',
              overflow: 'hidden',
            }}>
              {section.items.map((item, ii) => (
                <button
                  key={ii}
                  onClick={'onClick' in item ? item.onClick : undefined}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', background: 'none', border: 'none',
                    borderBottom: ii < section.items.length - 1 ? '1px solid #F2F4F7' : 'none',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: item.accent ? '#FFF0F0' : '#F2F4F7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <item.icon size={18} color={item.accent ? '#FF3B3B' : '#5d7ea0'} />
                  </div>
                  <span style={{
                    flex: 1, fontSize: 14, fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    color: item.accent ? '#FF3B3B' : '#0F1D2D',
                  }}>
                    {item.label}
                  </span>
                  {item.value && (
                    <span style={{
                      fontSize: 12, color: '#9AAABB',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {item.value}
                    </span>
                  )}
                  {!item.accent && <ChevronRight size={16} color="#B0C4D8" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Community */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#9AAABB',
          fontFamily: "'DM Sans', sans-serif",
          textTransform: 'uppercase', letterSpacing: '0.06em',
          marginBottom: 8, paddingLeft: 4,
        }}>
          Comunidad
        </div>
        <button
          onClick={() => window.open(DISCORD_INVITE_URL, '_blank', 'noopener,noreferrer')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', background: '#fff', border: '1px solid #E8EDF2',
            borderRadius: 16, cursor: 'pointer', textAlign: 'left',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#5865F214',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <DiscordIcon size={18} />
          </div>
          <span style={{
            flex: 1, fontSize: 14, fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            color: '#0F1D2D',
          }}>
            Únete a nuestro Discord
          </span>
          <ChevronRight size={16} color="#B0C4D8" />
        </button>
        <button
          onClick={() => window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', background: '#fff', border: '1px solid #E8EDF2',
            borderRadius: 16, cursor: 'pointer', textAlign: 'left', marginTop: 10,
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#E4405F14',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <InstagramIcon size={18} />
          </div>
          <span style={{
            flex: 1, fontSize: 14, fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            color: '#0F1D2D',
          }}>
            Síguenos en Instagram
          </span>
          <ChevronRight size={16} color="#B0C4D8" />
        </button>
      </div>

      {/* App availability */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 10 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', border: '1px solid #E8EDF2', borderRadius: 14,
          padding: '12px 14px',
        }}>
          <AndroidIcon size={22} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: '#0F1D2D' }}>
              Android
            </div>
            <div style={{ fontSize: 10, color: '#00B894', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
              Disponible
            </div>
          </div>
        </div>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', border: '1px solid #E8EDF2', borderRadius: 14,
          padding: '12px 14px', opacity: 0.7,
        }}>
          <AppleIcon size={20} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: '#0F1D2D' }}>
              iOS
            </div>
            <div style={{ fontSize: 10, color: '#9AAABB', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
              Próximamente
            </div>
          </div>
        </div>
      </div>

      {/* Made in RD */}
      <div style={{ padding: '8px 20px 0', textAlign: 'center' }}>
        <span style={{
          fontSize: 12, color: '#B0C4D8',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Hecho en 🇩🇴 RD con ❤️ · DóndeTa v1.0.0
        </span>
      </div>
    </div>
  )
}
