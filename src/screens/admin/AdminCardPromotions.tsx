import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, type CardPromotionForm } from '../../api/admin'
import { storesApi, type Store } from '../../api/stores'
import { colors, fonts, radii } from '../../design/tokens'
import { cardDealConditions, cardName, type CardPromotion } from '../../domain/cardPromotions'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const EMPTY: CardPromotionForm = {
  retailerSlug: '', bank: '', card: '', percent: '', maxDiscount: '', minPurchase: '',
  weekdays: [], startsOn: '', endsOn: '', termsUrl: '', note: '',
}

const input = {
  width: '100%', boxSizing: 'border-box' as const, padding: '9px 10px', borderRadius: radii.sm,
  border: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: 14, color: colors.navy, background: colors.card,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.navy400 }}>
      {label}
      <div style={{ marginTop: 4 }}>{children}</div>
    </label>
  )
}

// Bank card discounts per store. Each one needs an end date: the API stops
// showing it the day after and deletes it automatically.
export default function AdminCardPromotions() {
  const [promotions, setPromotions] = useState<CardPromotion[] | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [form, setForm] = useState<CardPromotionForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => adminApi.cardPromotions().then(setPromotions).catch(err => setError(err instanceof Error ? err.message : String(err)))
  useEffect(() => {
    refresh()
    storesApi.list().then(setStores).catch(() => {})
  }, [])

  const set = (key: keyof CardPromotionForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: event.target.value }))
  const toggleDay = (day: number) => setForm(prev => ({
    ...prev,
    weekdays: prev.weekdays.includes(day) ? prev.weekdays.filter(d => d !== day) : [...prev.weekdays, day],
  }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await adminApi.createCardPromotion(form)
      setForm({ ...EMPTY, startsOn: form.startsOn, endsOn: form.endsOn })
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (promotion: CardPromotion) => {
    if (!window.confirm(`¿Borrar ${cardName(promotion)} en ${promotion.store}?`)) return
    try {
      await adminApi.deleteCardPromotion(promotion.id)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.background, fontFamily: fonts.body, color: colors.navy }}>
      <header style={{ background: colors.card, borderBottom: `1px solid ${colors.border}`, padding: '14px 16px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/admin" style={{ color: colors.navy400, fontSize: 13 }}>← Admin</Link>
          <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 20 }}>Descuentos con tarjeta</div>
          <span style={{ fontSize: 13, color: colors.navy400 }}>Se muestran en cada producto y en los posts. Al pasar la fecha de fin se borran solos.</span>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: 16, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
        <form onSubmit={submit} style={{ background: colors.card, borderRadius: radii.lg, padding: 18, display: 'grid', gap: 12 }}>
          <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 16 }}>Nueva promoción</div>
          <Field label="Tienda">
            <select required value={form.retailerSlug} onChange={set('retailerSlug')} style={input}>
              <option value="">Elige…</option>
              {stores.map(store => <option key={store.slug} value={store.slug}>{store.name}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Banco"><input required value={form.bank} onChange={set('bank')} placeholder="BHD" style={input} /></Field>
            <Field label="Tarjeta (opcional)"><input value={form.card} onChange={set('card')} placeholder="Visa" style={input} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="Descuento %"><input required type="number" min={1} max={90} step="0.5" value={form.percent} onChange={set('percent')} style={input} /></Field>
            <Field label="Tope RD$"><input type="number" min={1} value={form.maxDiscount} onChange={set('maxDiscount')} placeholder="Sin tope" style={input} /></Field>
            <Field label="Compra mín. RD$"><input type="number" min={1} value={form.minPurchase} onChange={set('minPurchase')} style={input} /></Field>
          </div>
          <Field label="Días (ninguno = todos)">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DAYS.map((label, day) => {
                const on = form.weekdays.includes(day)
                return (
                  <button key={label} type="button" onClick={() => toggleDay(day)} aria-pressed={on} style={{
                    padding: '6px 10px', borderRadius: radii.full, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    border: `1px solid ${on ? colors.primary : colors.border}`, background: on ? colors.primaryLight : colors.card, color: on ? colors.primary : colors.navy400,
                  }}>{label}</button>
                )
              })}
            </div>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Desde"><input required type="date" value={form.startsOn} onChange={set('startsOn')} style={input} /></Field>
            <Field label="Hasta (obligatorio)"><input required type="date" value={form.endsOn} onChange={set('endsOn')} style={input} /></Field>
          </div>
          <Field label="Enlace a las condiciones (https://…)"><input type="url" value={form.termsUrl} onChange={set('termsUrl')} style={input} /></Field>
          <Field label="Nota corta (opcional)"><input value={form.note} onChange={set('note')} placeholder="solo electrodomésticos" maxLength={200} style={input} /></Field>
          {error && <div role="alert" style={{ color: colors.error, fontSize: 13 }}>{error}</div>}
          <button type="submit" disabled={saving} style={{
            padding: '11px 14px', borderRadius: radii.md, border: 'none', background: colors.primary, color: '#fff',
            fontFamily: fonts.display, fontWeight: 700, fontSize: 15, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
          }}>{saving ? 'Guardando…' : 'Agregar promoción'}</button>
        </form>

        <section style={{ background: colors.card, borderRadius: radii.lg, padding: 18 }}>
          <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Activas y próximas</div>
          {promotions === null ? (
            <div style={{ color: colors.navy400, fontSize: 14 }}>Cargando…</div>
          ) : promotions.length === 0 ? (
            <div style={{ color: colors.navy400, fontSize: 14 }}>No hay promociones cargadas.</div>
          ) : promotions.map(promotion => {
            const conditions = cardDealConditions(promotion)
            return (
              <div key={promotion.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${colors.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{promotion.store} · {cardName(promotion)} −{promotion.percent}%</div>
                  <div style={{ fontSize: 12, color: colors.navy400 }}>
                    {promotion.startsOn} → {promotion.endsOn}{conditions && ` · ${conditions}`}
                    {promotion.termsUrl && <> · <a href={promotion.termsUrl} target="_blank" rel="noreferrer">condiciones</a></>}
                  </div>
                </div>
                <button type="button" onClick={() => remove(promotion)} style={{
                  border: `1px solid ${colors.border}`, background: colors.card, color: colors.error, borderRadius: radii.sm,
                  padding: '6px 10px', fontSize: 13, cursor: 'pointer',
                }}>Borrar</button>
              </div>
            )
          })}
        </section>
      </main>
    </div>
  )
}
