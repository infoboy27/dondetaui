// Campaign links for promotions: the utm_* parameters are what lets GA4 (and
// the "Campañas" table in /admin) tell a paid Instagram promotion apart from
// the organic bio link.
export interface UtmInput {
  url: string
  source: string
  medium: string
  campaign: string
  content?: string
}

// "Eneba Lanzamiento Oct" -> "eneba-lanzamiento-oct": GA4 is case-sensitive,
// so one spelling per campaign keeps its rows together.
export function utmSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function utmLink({ url, source, medium, campaign, content }: UtmInput): string | null {
  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }
  const params: Array<[string, string | undefined]> = [
    ['utm_source', source],
    ['utm_medium', medium],
    ['utm_campaign', campaign],
    ['utm_content', content],
  ]
  for (const [key, value] of params) {
    const slug = value ? utmSlug(value) : ''
    if (slug) parsed.searchParams.set(key, slug)
    else parsed.searchParams.delete(key)
  }
  return parsed.toString()
}
