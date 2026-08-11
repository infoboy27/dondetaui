import { useEffect, useRef, useState } from 'react'
import type { BrowserMultiFormatReader as BrowserMultiFormatReaderType } from '@zxing/browser'
import { productsApi } from '../api/products'
import { formatPrice } from '../domain/currency'
import { getBestOffer, getSavingsRange } from '../domain/offers'
import { XIcon, FlashIcon, CheckIcon, ChevronRight } from '../components/Icons'
import ProductImage from '../components/ProductImage'
import type { Product } from '../types'

interface Props {
  onBack: () => void
  onProduct: (p: Product) => void
}

// Native BarcodeDetector (Chrome/Edge/Android WebView) needs no library and no
// per-frame canvas decode -- prefer it when present. Safari/iOS and older
// Chromium builds lack it, so @zxing/browser (loaded lazily, decodes off a
// <video> element continuously) is the fallback for everyone else.
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>
}
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorLike
  }
}

type ScanState = 'requesting' | 'scanning' | 'denied' | 'unsupported' | 'detected' | 'not-found'

export default function ScannerScreen({ onBack, onProduct }: Props) {
  const [state, setState] = useState<ScanState>('requesting')
  const [flashOn, setFlashOn] = useState(false)
  const [flashSupported, setFlashSupported] = useState(false)
  const [detectedProduct, setDetectedProduct] = useState<Product | null>(null)
  const [lastCode, setLastCode] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const zxingReaderRef = useRef<BrowserMultiFormatReaderType | null>(null)
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null)
  const rafRef = useRef<number | null>(null)
  const resolvingRef = useRef(false)

  const lookupCode = async (code: string) => {
    if (resolvingRef.current) return
    resolvingRef.current = true
    setLastCode(code)
    try {
      const product = await productsApi.barcode(code)
      setDetectedProduct(product)
      setState('detected')
    } catch {
      setState('not-found')
    }
  }

  const rescan = () => {
    resolvingRef.current = false
    setDetectedProduct(null)
    setLastCode(null)
    setState('scanning')
  }

  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const next = !flashOn
    try {
      // @ts-expect-error -- torch is a real but not-yet-typed constraint (ImageCapture spec)
      await track.applyConstraints({ advanced: [{ torch: next }] })
      setFlashOn(next)
    } catch {
      /* torch unsupported on this device/browser -- button stays visually inert */
    }
  }

  useEffect(() => {
    let cancelled = false

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setState('unsupported')
        return
      }
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
      } catch {
        if (!cancelled) setState('denied')
        return
      }
      if (cancelled) {
        stream.getTracks().forEach(track => track.stop())
        return
      }
      streamRef.current = stream
      const track = stream.getVideoTracks()[0]
      const caps = track.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined
      setFlashSupported(Boolean(caps?.torch))
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setState('scanning')

      if (window.BarcodeDetector) {
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
        })
        const tick = async () => {
          if (cancelled || !videoRef.current || resolvingRef.current) {
            if (!cancelled) rafRef.current = requestAnimationFrame(tick)
            return
          }
          try {
            const results = await detector.detect(videoRef.current)
            if (results[0]?.rawValue) void lookupCode(results[0].rawValue)
          } catch { /* transient decode failure -- try again next frame */ }
          if (!cancelled) rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } else {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (cancelled || !videoRef.current) return
        const reader = new BrowserMultiFormatReader()
        zxingReaderRef.current = reader
        const controls = await reader.decodeFromVideoElement(videoRef.current, (result) => {
          const text = result?.getText()
          if (text) void lookupCode(text)
        })
        zxingControlsRef.current = controls
      }
    }

    void start()

    return () => {
      cancelled = true
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      zxingControlsRef.current?.stop()
      streamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  const cheapest = detectedProduct ? getBestOffer(detectedProduct.prices) : null
  const savings = detectedProduct ? getSavingsRange(detectedProduct.prices) : 0
  const detected = state === 'detected' && detectedProduct && cheapest

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
        {flashSupported && (
          <button
            onClick={() => void toggleFlash()}
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
        )}
      </div>

      {/* Camera feed */}
      <div style={{ flex: 1, position: 'relative', minHeight: 460, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            background: 'linear-gradient(135deg, #0d1f35 0%, #0A1628 50%, #0d1f35 100%)',
            display: state === 'requesting' || state === 'denied' || state === 'unsupported' ? 'none' : 'block',
          }}
        />

        {(state === 'denied' || state === 'unsupported' || state === 'requesting') && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, padding: '0 32px', textAlign: 'center',
          }}>
            {state === 'requesting' && (
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif" }}>
                Solicitando acceso a la cámara…
              </span>
            )}
            {state === 'denied' && (
              <>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: "'Poppins', sans-serif" }}>
                  No se pudo acceder a la cámara
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Sans', sans-serif" }}>
                  Habilita el permiso de cámara para este sitio en tu navegador e inténtalo de nuevo.
                </span>
              </>
            )}
            {state === 'unsupported' && (
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif" }}>
                Este navegador no soporta acceso a la cámara.
              </span>
            )}
          </div>
        )}

        {/* Scan frame */}
        {(state === 'scanning' || state === 'not-found' || detected) && (
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
                borderColor: detected ? '#00B894' : state === 'not-found' ? '#FF9F1C' : '#fff',
                borderStyle: 'solid',
                borderTopWidth: corner.bt,
                borderLeftWidth: corner.bl,
                borderBottomWidth: corner.bb,
                borderRightWidth: corner.br,
                borderRadius: corner.radius,
                transition: 'border-color 0.3s',
              }} />
            ))}

            {state === 'scanning' && (
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
          </div>
        )}

        <div style={{
          position: 'absolute',
          bottom: 60, left: 0, right: 0,
          textAlign: 'center',
        }}>
          {state === 'scanning' && (
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
          )}
          {state === 'not-found' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 13, color: '#FF9F1C', fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Código {lastCode} no está en nuestro catálogo todavía
              </span>
              <button
                onClick={rescan}
                style={{
                  padding: '8px 20px', borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                }}
              >
                Escanear de nuevo
              </button>
            </div>
          )}
          {detected && (
            <span style={{
              fontSize: 13, color: '#00B894', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              ¡Producto encontrado!
            </span>
          )}
        </div>
      </div>

      {detected && (
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
