'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { DUTY_FREE_LIMIT_USD, TARIFF_OPTIONS, importCost, savingVsLocal, type ImportInput } from '../../lib/importCost'
import { colors, fonts } from '../../lib/tokens'

// Illustrative defaults: the shopper should replace the rate and courier
// tariff with their own (the page says so next to each field).
const DEFAULTS: ImportInput = {
  price: 0, salesTaxPct: 7, usShipping: 0, weightLb: 3, ratePerLb: 3, courierFees: 5,
  tariffPct: 20, rate: 63, cardFeePct: 0,
}

const usd = (n: number) => `US$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const dop = (n: number) => `RD$${Math.round(n).toLocaleString('en-US')}`

const label: CSSProperties = { display: 'block', fontFamily: fonts.body, fontSize: 13.5, fontWeight: 600, color: colors.navy, marginBottom: 4 }
const hint: CSSProperties = { fontFamily: fonts.body, fontSize: 12, color: colors.navy400, marginTop: 3, lineHeight: 1.4 }
const input: CSSProperties = {
  width: '100%', boxSizing: 'border-box', fontFamily: fonts.body, fontSize: 16, color: colors.navy,
  padding: '10px 12px', border: `1px solid ${colors.border}`, borderRadius: 10, background: '#fff',
}

function Field({ id, name, help, value, onChange, step = 'any' }: {
  id: string; name: string; help?: string; value: number; onChange: (n: number) => void; step?: string
}) {
  return (
    <div>
      <label htmlFor={id} style={label}>{name}</label>
      <input
        id={id} type="number" inputMode="decimal" min={0} step={step} style={input}
        value={Number.isFinite(value) && value !== 0 ? value : ''}
        placeholder="0"
        onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
      {help && <div style={hint}>{help}</div>}
    </div>
  )
}

export default function Calculator({ initialLocal, productName, amazonUrl }: {
  initialLocal: number; productName: string | null; amazonUrl: string | null
}) {
  const [v, setV] = useState<ImportInput>(DEFAULTS)
  const [local, setLocal] = useState(initialLocal)
  const set = (key: keyof ImportInput) => (n: number) => setV(prev => ({ ...prev, [key]: n }))

  const cost = useMemo(() => importCost(v), [v])
  const saving = savingVsLocal(cost, local)
  const ready = v.price > 0

  return (
    <section style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 18, marginBottom: 18 }}>
      {productName && (
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.navy400, margin: '0 0 14px' }}>
          Calculando: <b style={{ color: colors.navy }}>{productName}</b>
          {amazonUrl && (
            <>
              {' · '}
              <a href={amazonUrl} data-store="Amazon" rel="nofollow sponsored noopener" target="_blank" style={{ color: colors.primary }}>
                ver su precio en Amazon ↗
              </a>
            </>
          )}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <Field id="price" name="Precio en Amazon (US$)" value={v.price} onChange={set('price')} />
        <Field id="tax" name="Impuesto de venta en EE. UU. (%)" help="Florida cobra 7 % si tu courier está en Miami." value={v.salesTaxPct} onChange={set('salesTaxPct')} />
        <Field id="ship" name="Envío de Amazon a Miami (US$)" help="0 si el envío es gratis." value={v.usShipping} onChange={set('usShipping')} />
        <Field id="lb" name="Peso a cobrar (libras)" help="El mayor entre el peso real y el volumétrico de la caja." value={v.weightLb} onChange={set('weightLb')} />
        <Field id="rate-lb" name="Tarifa del courier por libra (US$)" help="Pon la de tu courier." value={v.ratePerLb} onChange={set('ratePerLb')} />
        <Field id="fees" name="Cargos fijos del courier (US$)" help="Manejo, combustible, seguro…" value={v.courierFees} onChange={set('courierFees')} />
        <div>
          <label htmlFor="tariff" style={label}>Arancel si pasa de US${DUTY_FREE_LIMIT_USD} (%)</label>
          <select id="tariff" style={input} value={v.tariffPct} onChange={e => set('tariffPct')(Number(e.target.value))}>
            {TARIFF_OPTIONS.map(t => <option key={t} value={t}>{t} %</option>)}
          </select>
          <div style={hint}>Depende del producto y de dónde se fabricó. Si no sabes, deja 20 % para no quedarte corto.</div>
        </div>
        <Field id="fx" name="Tasa de tu tarjeta (RD$ por US$)" help="La que te cobra tu banco, no la del periódico." value={v.rate} onChange={set('rate')} />
        <Field id="card" name="Comisión de la tarjeta (%)" help="Por compras en dólares, si tu tarjeta la cobra." value={v.cardFeePct} onChange={set('cardFeePct')} />
        <Field id="local" name="Precio en tienda de RD (RD$)" help="El más barato que ves en DóndeTa." value={local} onChange={setLocal} />
      </div>

      <div style={{ marginTop: 18, padding: 16, borderRadius: 14, background: colors.navy, color: '#fff' }} aria-live="polite">
        {!ready ? (
          <div style={{ fontFamily: fonts.body, fontSize: 15 }}>Escribe el precio de Amazon para ver el total.</div>
        ) : (
          <>
            <div style={{ fontFamily: fonts.body, fontSize: 13, opacity: 0.8 }}>Total estimado puesto en RD</div>
            <div style={{ fontFamily: fonts.display, fontSize: 30, fontWeight: 700 }}>{dop(cost.totalDop)}</div>
            <div style={{ fontFamily: fonts.body, fontSize: 13, opacity: 0.85, marginTop: 6, lineHeight: 1.6 }}>
              Compra {usd(cost.goodsUsd)} · courier {usd(cost.courierUsd)} ·{' '}
              {cost.dutyFree ? `sin impuestos (US$${DUTY_FREE_LIMIT_USD} o menos)` : `impuestos ${usd(cost.taxesUsd)}`} · total {usd(cost.totalUsd)}
            </div>
            {saving !== null && (
              <div style={{ marginTop: 12, fontFamily: fonts.body, fontSize: 16, fontWeight: 700, color: saving > 0 ? '#7CE0C3' : '#FFD166' }}>
                {saving > 0
                  ? `Traerlo te ahorra unos ${dop(saving)} frente a la tienda de aquí.`
                  : saving < 0
                    ? `Sale ${dop(-saving)} más caro que en la tienda de aquí. Cómpralo aquí.`
                    : 'Sale igual que en la tienda de aquí.'}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
