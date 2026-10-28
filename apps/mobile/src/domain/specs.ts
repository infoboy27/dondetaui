// Technical specs for the product screen. Values are the retailers' own labels,
// shown as published; DóndeTa does not measure or score them.
export interface SpecEntry { label: string; value: string }

export function specEntries(specs: Record<string, string> | undefined): SpecEntry[] {
  if (!specs) return []
  return Object.entries(specs)
    .map(([label, value]) => ({ label: label.trim(), value: String(value).trim() }))
    .filter(entry => entry.label && entry.value)
}
