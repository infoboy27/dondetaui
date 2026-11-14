// Review moderation rules. Plain module (no Nest imports) so the root vitest
// run can test it.

// Reports that hide a review automatically, pending the owner's decision.
export const AUTO_HIDE_REPORTS = 3

export function shouldAutoHide(reportCount: number): boolean {
  return reportCount >= AUTO_HIDE_REPORTS
}

// Objectionable words (insults, slurs, sexual and violent terms) in Dominican
// and general Spanish. Matched as whole words after normalizing accents,
// case, repeated letters and common leetspeak, so "M1erda" or "pendejooo"
// still match while "caparazón" or "computadora" never do.
//
// Deliberately leaves out words with everyday product meanings ("cuero"
// leather, "pato", "polla") and mild complaints ("maldito precio",
// "estúpido"): a false positive blocks a legitimate review, and reports plus
// the owner's review catch the rest.
const BLOCKED = [
  'mierda', 'mierdero', 'coño', 'puta', 'puto', 'putas', 'putos', 'hijueputa', 'hijoeputa', 'hdp',
  'pendejo', 'pendeja', 'pendejos', 'cabron', 'cabrona', 'mamaguevo', 'mamaguebo', 'mmg', 'mamahuevo',
  'singar', 'singao', 'singada', 'chinga', 'chingada', 'chingar', 'verga', 'vergas', 'culo', 'culero',
  'maricon', 'maricona', 'marica', 'zorra', 'malparido', 'malparida', 'gonorrea',
  'imbecil', 'retrasado', 'retrasada', 'mongolo', 'mongolico', 'subnormal',
  'te voy a matar', 'te mato', 'violar', 'violacion',
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/\p{M}+/gu, '')
    .replace(/[0@4]/g, m => ({ '0': 'o', '@': 'a', '4': 'a' })[m] ?? m)
    .replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/5|\$/g, 's').replace(/7/g, 't')
    .replace(/([a-z])\1{2,}/g, '$1')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const PATTERNS = BLOCKED.map(word => new RegExp(`(^| )${normalize(word)}( |$)`))

export function hasObjectionableContent(text: string | null | undefined): boolean {
  if (!text) return false
  const normalized = ` ${normalize(text)} `
  return PATTERNS.some(pattern => pattern.test(normalized))
}

export const OBJECTIONABLE_MESSAGE =
  'Tu reseña tiene palabras que no permitimos. Cuéntanos tu experiencia con el producto sin insultos ni lenguaje ofensivo.'

export const BANNED_MESSAGE = 'Tu cuenta no puede publicar reseñas. Si crees que es un error, escríbenos desde la página de contacto.'

// Report reasons the clients offer; anything else is stored as "other".
export const REPORT_REASONS = ['offensive', 'spam', 'false', 'other'] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

export function reportReason(raw: unknown): ReportReason {
  return typeof raw === 'string' && (REPORT_REASONS as readonly string[]).includes(raw) ? (raw as ReportReason) : 'other'
}

const REASON_LABEL: Record<ReportReason, string> = {
  offensive: 'ofensiva',
  spam: 'spam',
  false: 'falsa o engañosa',
  other: 'otro motivo',
}

export function reportAlertMessage(input: { productName: string; comment: string | null; reason: ReportReason; reports: number; hidden: boolean }): string {
  const excerpt = (input.comment ?? '(sin comentario)').replace(/\s+/g, ' ').slice(0, 200)
  return [
    `🚩 Reseña reportada (${REASON_LABEL[input.reason]}) en "${input.productName.slice(0, 80)}"`,
    `• "${excerpt}"`,
    `• Reportes: ${input.reports}${input.hidden ? ' — se ocultó automáticamente' : ''}`,
    '• Revisa en /admin → Reseñas (compromiso: menos de 24 h).',
  ].join('\n')
}

// Public, stable id for "hide this author": the same for all of an author's
// reviews, but it doesn't reveal the user id. Computed in SQL
// (left(encode(sha256(...)), 16)); this mirrors it for tests and clients.
export const AUTHOR_KEY_SQL = `left(encode(sha256(('dondeta-author:' || pr.user_id::text)::bytea), 'hex'), 16)`
