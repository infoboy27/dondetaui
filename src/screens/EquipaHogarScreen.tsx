import { useState } from 'react'
import { formatPrice } from '../data/mock'
import { CURRENCY_SYMBOL } from '../domain/currency'
import { ChevronLeft, CheckIcon, ArrowRightIcon } from '../components/Icons'

const CATEGORIES = [
  { id: 'nevera', label: 'Nevera', emoji: '🧊', recommended: { store: 'Plaza Lama', price: 78995, savings: 4000 } },
  { id: 'estufa', label: 'Estufa', emoji: '🔥', recommended: { store: 'Corripio', price: 22500, savings: 2500 } },
  { id: 'lavadora', label: 'Lavadora', emoji: '🫧', recommended: { store: 'Plaza Lama', price: 24495, savings: 3000 } },
  { id: 'secadora', label: 'Secadora', emoji: '♨️', recommended: { store: 'Sirena', price: 19995, savings: 1500 } },
  { id: 'tv', label: 'TV', emoji: '📺', recommended: { store: 'Jumbo', price: 32995, savings: 2000 } },
  { id: 'microondas', label: 'Microondas', emoji: '📡', recommended: { store: 'PriceSmart', price: 8995, savings: 1000 } },
  { id: 'aire', label: 'Aire A/C', emoji: '❄️', recommended: { store: 'Corripio', price: 28995, savings: 3000 } },
  { id: 'sofa', label: 'Sofá', emoji: '🛋️', recommended: null },
  { id: 'comedor', label: 'Comedor', emoji: '🪑', recommended: null },
  { id: 'colchon', label: 'Colchón', emoji: '🛏️', recommended: null },
]

interface Props {
  onBack: () => void
}

export default function EquipaHogarScreen({ onBack }: Props) {
  const [selected, setSelected] = useState<string[]>(['nevera', 'lavadora', 'tv', 'aire'])
  const [budget, setBudget] = useState('300000')
  const [showSummary, setShowSummary] = useState(false)

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectedCats = CATEGORIES.filter(c => selected.includes(c.id) && c.recommended)
  const totalEstimado = selectedCats.reduce((sum, c) => sum + (c.recommended?.price ?? 0), 0)
  const totalSavings = selectedCats.reduce((sum, c) => sum + (c.recommended?.savings ?? 0), 0)
  const budgetNum = parseInt(budget.replace(/,/g, '')) || 0

  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 20px 20px',
        borderBottom: '1px solid #E8EDF2',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button
            onClick={onBack}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#F2F4F7', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronLeft size={18} color="#0F1D2D" />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{
                fontSize: 20, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D', margin: 0,
                letterSpacing: '-0.03em',
              }}>
                Equipa tu hogar
              </h1>
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#FF9F1C',
                fontFamily: "'Poppins', sans-serif",
                background: '#FFF3E0', padding: '2px 8px', borderRadius: 999,
                letterSpacing: '0.03em',
              }}>
                PRÓXIMAMENTE
              </span>
            </div>
            <p style={{
              fontSize: 12, color: '#9AAABB',
              fontFamily: "'DM Sans', sans-serif",
              margin: '2px 0 0',
              lineHeight: '1.4',
            }}>
              Arma tu lista y DóndeTa encuentra dónde comprar cada cosa al mejor precio
            </p>
          </div>
        </div>

        {/* Budget input */}
        <div>
          <label style={{
            fontSize: 11, fontWeight: 700, color: '#9AAABB',
            fontFamily: "'DM Sans', sans-serif",
            textTransform: 'uppercase', letterSpacing: '0.05em',
            display: 'block', marginBottom: 8,
          }}>
            Tu presupuesto
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#F2F4F7', borderRadius: 14,
            padding: '0 16px', height: 52,
            border: '1.5px solid #E8EDF2',
          }}>
            <span style={{
              fontSize: 18, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: '#0F1D2D',
            }}>
              {CURRENCY_SYMBOL}
            </span>
            <input
              value={budget}
              onChange={e => setBudget(e.target.value.replace(/\D/g, ''))}
              placeholder="300,000"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 20, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D', letterSpacing: '-0.02em',
              }}
            />
          </div>
        </div>
      </div>

      {/* Category selection */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ marginBottom: 12 }}>
          <span style={{
            fontSize: 15, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            color: '#0F1D2D',
          }}>
            ¿Qué necesitas? <span style={{ color: '#9AAABB', fontWeight: 400, fontSize: 13 }}>
              ({selected.length} seleccionados)
            </span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
          {CATEGORIES.map(cat => {
            const isSelected = selected.includes(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => toggle(cat.id)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: '14px 8px',
                  background: isSelected ? '#E6F7F3' : '#fff',
                  border: `1.5px solid ${isSelected ? '#00B894' : '#E8EDF2'}`,
                  borderRadius: 16, cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s',
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#00B894',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckIcon size={9} color="#fff" />
                  </div>
                )}
                <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  color: isSelected ? '#00B894' : '#0F1D2D',
                  textAlign: 'center',
                }}>
                  {cat.label}
                </span>
                {!cat.recommended && (
                  <span style={{
                    fontSize: 8, color: '#B0C4D8',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Próximo
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Generate button */}
        <button
          onClick={() => setShowSummary(true)}
          disabled={selected.length === 0}
          style={{
            width: '100%', padding: '15px 0',
            border: 'none', borderRadius: 14,
            background: selected.length > 0 ? '#00B894' : '#D8E6F0',
            color: '#fff', cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
            fontSize: 15, fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: selected.length > 0 ? '0 4px 16px rgba(0,184,148,0.3)' : 'none',
            transition: 'all 0.2s',
            marginBottom: 24,
          }}
        >
          Encontrar los mejores precios
          <ArrowRightIcon size={18} color="#fff" />
        </button>

        {/* Summary */}
        {showSummary && selectedCats.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {/* Budget card */}
            <div style={{
              background: 'linear-gradient(135deg, #00B894 0%, #00cba0 100%)',
              borderRadius: 16, padding: '20px',
              marginBottom: 16,
              boxShadow: '0 6px 20px rgba(0,184,148,0.25)',
            }}>
              <div style={{
                fontSize: 12, color: 'rgba(255,255,255,0.75)',
                fontFamily: "'DM Sans', sans-serif", marginBottom: 12,
              }}>
                Resumen de presupuesto
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: "'DM Sans', sans-serif" }}>
                  Tu presupuesto
                </span>
                <span style={{
                  fontSize: 16, fontWeight: 700, color: '#fff',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  {formatPrice(budgetNum || 300000)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: "'DM Sans', sans-serif" }}>
                  Total estimado
                </span>
                <span style={{
                  fontSize: 16, fontWeight: 700, color: '#fff',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  {formatPrice(totalEstimado)}
                </span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#FFD166', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                  💰 Total ahorrado
                </span>
                <span style={{
                  fontSize: 20, fontWeight: 800, color: '#FFD166',
                  fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.03em',
                }}>
                  {formatPrice(totalSavings)}
                </span>
              </div>
            </div>

            {/* Recommendations */}
            <div style={{ marginBottom: 12 }}>
              <span style={{
                fontSize: 15, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D',
              }}>
                Dónde comprar cada cosa
              </span>
            </div>

            {selectedCats.map(cat => (
              <div key={cat.id} style={{
                background: '#fff', borderRadius: 16,
                border: '1px solid #E8EDF2',
                padding: '14px 16px', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{cat.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    color: '#0F1D2D', marginBottom: 2,
                  }}>
                    {cat.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 11, color: '#9AAABB',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      Mejor en {cat.recommended!.store}
                    </span>
                    <span style={{
                      fontSize: 10, color: '#00B894', fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      background: '#E6F7F3', padding: '1px 6px', borderRadius: 999,
                    }}>
                      Ahorras {formatPrice(cat.recommended!.savings)}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    color: '#00B894', letterSpacing: '-0.02em',
                  }}>
                    {formatPrice(cat.recommended!.price)}
                  </div>
                  <div style={{
                    fontSize: 10, color: '#9AAABB',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {cat.recommended!.store}
                  </div>
                </div>
              </div>
            ))}

            {/* Coming soon note */}
            <div style={{
              background: '#FFF3E0', borderRadius: 12,
              border: '1px solid #FFD16650',
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>🚀</span>
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  color: '#FF9F1C', marginBottom: 2,
                }}>
                  Función en desarrollo
                </div>
                <div style={{
                  fontSize: 11, color: '#5d7ea0',
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: '1.4',
                }}>
                  Pronto podrás generar un carrito completo optimizado por tienda y hacer el pedido desde DóndeTa.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
