import { BellIcon, HeartIcon, ShieldIcon, HelpCircleIcon, LogOutIcon, ChevronRight, MapPinIcon, SettingsIcon } from '../components/Icons'

interface Props {
  favoriteCount: number
  onFavorites: () => void
}

export default function ProfileScreen({ favoriteCount, onFavorites }: Props) {
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
        { icon: BellIcon, label: 'Mis alertas de precio', value: '3 activas', accent: false },
        { icon: MapPinIcon, label: 'Tiendas preferidas', value: 'Plaza Lama, Sirena', accent: false },
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
    {
      title: '',
      items: [
        { icon: LogOutIcon, label: 'Cerrar sesión', value: '', accent: true },
      ],
    },
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

        {/* Avatar + info */}
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
              CA
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 18, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: '#0F1D2D', marginBottom: 2,
              letterSpacing: '-0.02em',
            }}>
              Carlos Almonte
            </div>
            <div style={{
              fontSize: 13, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 6,
            }}>
              carlos.almonte@gmail.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPinIcon size={12} color="#9AAABB" />
              <span style={{
                fontSize: 12, color: '#9AAABB',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Santo Domingo, RD
              </span>
            </div>
          </div>
          <button style={{
            background: '#E6F7F3', border: 'none', borderRadius: 10,
            padding: '8px 14px', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, color: '#00B894',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Editar
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ background: '#fff', margin: '12px 16px 0', borderRadius: 16, border: '1px solid #E8EDF2' }}>
        <div style={{ display: 'flex' }}>
          {[
            { label: 'Comparaciones', value: '47' },
            { label: 'Ahorrado', value: 'RD$12,480' },
            { label: 'Alertas', value: '3' },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '16px 8px',
              borderRight: i < 2 ? '1px solid #F2F4F7' : 'none',
            }}>
              <div style={{
                fontSize: 18, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#00B894', letterSpacing: '-0.02em',
                marginBottom: 2,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 11, color: '#9AAABB',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
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
