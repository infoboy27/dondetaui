import { GUIDES_A } from './guides/batch-a'
import { GUIDES_B } from './guides/batch-b'
import { GUIDES_C } from './guides/batch-c'
import { GUIDES_D } from './guides/batch-d'
import { GUIDES_E } from './guides/batch-e'

export const CONTACT_EMAIL = 'jonathanmaria@gmail.com'

export const MAIN_NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/precios', label: 'Precios' },
  { href: '/black-friday', label: 'Black Friday' },
  { href: '/metodologia', label: 'Metodología' },
  { href: '/guias', label: 'Guías' },
  { href: '/sobre-dondeta', label: 'Sobre DóndeTa' },
  { href: '/contacto', label: 'Contacto' },
]

export interface GuideSection {
  title: string
  /** One or more paragraphs. */
  body: string[]
  /** Optional bullet list rendered after the paragraphs. */
  list?: string[]
}

export interface Guide {
  slug: string
  title: string
  description: string
  /** ISO date of the last substantive review of this guide. */
  updated: string
  /** One or more intro paragraphs. */
  intro: string[]
  sections: GuideSection[]
  faqs?: { q: string; a: string }[]
  /** Slugs of related guides. */
  related?: string[]
}

export const BUYING_GUIDES: Guide[] = [
  ...GUIDES_D,
  ...GUIDES_E,
  ...GUIDES_A,
  ...GUIDES_B,
  ...GUIDES_C,
]

export function findGuide(slug: string): Guide | undefined {
  return BUYING_GUIDES.find(guide => guide.slug === slug)
}

/** Rough reading-time estimate in minutes for a guide's body text. */
export function guideReadingMinutes(guide: Guide): number {
  const words = [
    ...guide.intro,
    ...guide.sections.flatMap(s => [...s.body, ...(s.list ?? [])]),
    ...(guide.faqs?.flatMap(f => [f.q, f.a]) ?? []),
  ]
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(2, Math.round(words / 200))
}
