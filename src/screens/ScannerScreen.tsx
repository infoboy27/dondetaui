import { useEffect, useState } from 'react'
import { productsApi } from '../api/products'
import { appConfig } from '../config/env'
import { PRODUCTS } from '../data/mock'
import { formatPrice } from '../domain/currency'
import { getBestOffer, getSavingsRange } from '../domain/offers'
import { XIcon, FlashIcon, CheckIcon, ChevronRight } from '../components/Icons'
import ProductImage from '../components/ProductImage'
import type { Product } from '../types'

interface Props {
  onBack: () => void
  onProduct: (p: Product) => void
}

const DEMO_BARCODE = '8806092000001'

export default function ScannerScreen({ onBack, onProduct }: Props) {
  const [scanning, setScanning] = useState(true)
  const [flashOn, setFlashOn] = useState(false)
  const [detected, setDetected] = useState(false)
  const [detectedProduct, setDetectedProduct] = useState<Product>(PRODUCTS[0])

  useEffect(() => {
    if (!scanning) return
    let cancelled = false

    const timer = setTimeout(() => {
      const resolveProduct = async () => {
        let product = PRODUCTS[0]

        if (appConfig.useApi) {
          try {
            product = await productsApi.barcode(DEMO_BARCODE)
          } catch {
            product = PRODUCTS[0]
          }
        }

        if (!cancelled) {
          setDetectedProduct(product)
          setScanning(false)
          setDetected(true)
        }
      }

      void resolveProduct()
    }, 2500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [scanning])

  const cheapest = getBestOffer(detectedProduct.prices)
  const savings = getSavingsRange(detectedProduct.prices)

  return (
    <div style={{
      background: '#0A1628',
      minHeight: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: detected ? 0 : 80,
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '20px 20px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          <XIcon size={18} color="#fff" />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{
            fontSize: 16, fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
            color: '#fff', margin: 0, letterSpacing: '-0.02em',
          }}>
            Escanea el código de barras
          </h2>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.6)',
            fontFamily: "'DM Sans', sans-serif",
            margin: 0,
          }}>
            Apunta al código de barras del producto
          </p>
        </div>
        <button
          onClick={() => setFlashOn(!flashOn)}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: flashOn ? '#FFD166' : 'rgba(255,255,255,0.15)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          <FlashIcon size={18} color={flashOn ? '#0F1D2D' : '#fff'} />
        </button>
      </div>

      {/* Camera feed simulation */}
      <div style={{ flex: 1, position: 'relative', minHeight: 460 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #0d1f35 0%, #0A1628 50%, #0d1f35 100%)',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '20%', left: '10%',
            width: 120, height: 80, borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            filter: 'blur(2px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '20%', right: '10%',
            width: 100, height: 60, borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            filter: 'blur(2px)',
          }} />
        </div>

        {/* Scan frame */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -55%)',
          width: 260, height: 140,
        }}>
          {[
            { pos: { top: 0, left: 0 }, radius: '4px 0 0 0', bt: 3, bl: 3, bb: 0, br: 0 },
            { pos: { top: 0, right: 0 }, radius: '0 4px 0 0', bt: 3, bl: 0, bb: 0, br: 3 },
            { pos: { bottom: 0, left: 0 }, radius: '0 0 0 4px', bt: 0, bl: 3, bb: 3, br: 0 },
            { pos: { bottom: 0, right: 0 }, radius: '0 0 4px 0', bt: 0, bl: 0, bb: 3, br: 3 },
          ].map((corner, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: 24, height: 24,
              ...corner.pos,
              borderColor: detected ? '#00B894' : '#fff',
              borderStyle: 'solid',
              borderTopWidth: corner.bt,
              borderLeftWidth: corner.bl,
              borderBottomWidth: corner.bb,
              borderRightWidth: corner.br,
              borderRadius: corner.radius,
              transition: 'border-color 0.3s',
            }} />
          ))}

          {scanning && (
            <div
              className="scan-line"
              style={{
                position: 'absolute',
                left: 12, right: 12, height: 2,
                background: 'linear-gradient(90deg, transparent, #00B894, transparent)',
                borderRadius: 1,
                boxShadow: '0 0 8px rgba(0,184,148,0.8)',
              }}
            />
          )}

          {detected && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,184,148,0.15)',
              borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: '#00B894',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0,184,148,0.5)',
              }}>
                <CheckIcon size={22} color="#fff" />
              </div>
            </div>
          )}

          {!detected && (
            <div style={{
              position: 'absolute', bottom: -32,
              left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 2, alignItems: 'stretch',
              height: 24, opacity: 0.25,
            }}>
              {[2,1,3,1,2,1,1,2,3,1,2,1,1,3,2,1,2,1,3,2,1].map((w, i) => (
                <div key={i} style={{ width: w * 2, background: '#fff', borderRadius: 1 }} />
              ))}
            </div>
          )}
        </div>

        <div style={{
          position: 'absolute',
          bottom: 60, left: 0, right: 0,
          textAlign: 'center',
        }}>
          {scanning ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="pulse-ring" style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#00B894',
                boxShadow: '0 0 12px rgba(0,184,148,0.8)',
              }} />
              <span style={{
                fontSize: 13, color: 'rgba(255,255,255,0.7)',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Buscando código de barras…
              </span>
            </div>
          ) : (
            <span style={{
              fontSize: 13, color: '#00B894', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              ¡Producto encontrado!
            </span>
          )}
        </div>
      </div>

      {detected && cheapest && (
        <div className="slide-up" style={{
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 36px',
        }}>
          <div style={{
            width: 40, height: 4, borderRadius: 2,
            background: '#E8EDF2', margin: '0 auto 20px',
          }} />

          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4,
          }}>
            <span style={{
              fontSize: 11, color: '#00B894', fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              background: '#E6F7F3', padding: '2px 8px', borderRadius: 999,
            }}>
              Producto encontrado
            </span>
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 12,
              background: '#F8FAFC', overflow: 'hidden',
              border: '1px solid #E8EDF2', flexShrink: 0,
            }}>
              <ProductImage src={detectedProduct.image} alt={detectedProduct.name} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 14, fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                color: '#0F1D2D', marginBottom: 2, lineHeight: '1.3',
              }}>
                {detectedProduct.name}
              </div>
              <div style={{
                fontSize: 12, color: '#9AAABB',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {detectedProduct.subtitle}
              </div>
            </div>
          </div>

          <div style={{
            background: '#E6F7F3', borderRadius: 12,
            padding: '14px 16px', marginBottom: 16,
          }}>
            <div style={{
              fontSize: 11, color: '#00B894', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 4,
            }}>
              Más barato en {cheapest.store}
            </div>
            <div style={{
              fontSize: 28, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              color: '#0F1D2D', letterSpacing: '-0.04em',
              marginBottom: 2,
            }}>
              {formatPrice(cheapest.price)}
            </div>
            <div style={{
              fontSize: 13, color: '#FF9F1C', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Ahorras {formatPrice(savings)} vs la tienda más cara
            </div>
          </div>

          <button
            onClick={() => onProduct(detectedProduct)}
            style={{
              width: '100%', padding: '14px 0',
              border: 'none', borderRadius: 12,
              background: '#00B894', color: '#fff',
              fontSize: 15, fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(0,184,148,0.3)',
            }}
          >
            Ver comparaciones
            <ChevronRight size={18} color="#fff" />
          </button>
        </div>
      )}
    </div>
  )
}