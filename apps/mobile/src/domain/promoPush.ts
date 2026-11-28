// "Ofertas y recordatorios": promotional pushes need an explicit opt-in shown
// in the app and an easy way out (App Store Guideline 4.5.4). Off until the
// person turns it on (Home card or Perfil switch); the card only offers it.

export type PromoPref = 'unset' | 'on' | 'off'

export const PROMO_CARD_SNOOZE_DAYS = 30

export function parsePromoPref(raw: string | null): PromoPref {
  return raw === 'on' || raw === 'off' ? raw : 'unset'
}

/** The Home card: never once the person chose (on or off), and not again for a while after "×". */
export function shouldShowPromoCard(input: { supported: boolean; pref: PromoPref; dismissedAt: number | null; now?: number }): boolean {
  if (!input.supported || input.pref !== 'unset') return false
  if (input.dismissedAt === null) return true
  return (input.now ?? Date.now()) - input.dismissedAt >= PROMO_CARD_SNOOZE_DAYS * 86_400_000
}

export const PROMO_COPY = {
  title: 'Ofertas y recordatorios',
  text: 'Te avisamos de ofertas reales y de fechas como Black Friday. Pocas veces al mes. Lo desactivas cuando quieras en Perfil.',
  footer: 'Avisos de ofertas y fechas especiales en este teléfono. Puedes desactivarlos cuando quieras.',
} as const
