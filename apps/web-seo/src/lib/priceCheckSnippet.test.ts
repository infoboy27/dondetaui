import { describe, expect, it } from 'vitest'
import { salesEvent } from './blackFriday'
import { buildCountry } from './country'
import { priceCheckSnippet } from './priceCheckPage'

describe('priceCheckSnippet', () => {
  const before = new Date('2026-11-25T12:00:00Z')

  it('names the date and the Dominican stores', () => {
    const { title, description } = priceCheckSnippet(salesEvent('black-friday', before), buildCountry({}))
    expect(title).toBe('Black Friday 2026 República Dominicana: ¿la oferta es real? | DóndeTa')
    expect(description).toMatch(/^Black Friday es el viernes, 27 de noviembre\./)
    expect(description).toContain('Plaza Lama, Sirena, Jumbo, Corripio y PriceSmart')
    expect(description.length).toBeLessThanOrEqual(170)
  })

  it('stays generic for other countries and uses the past tense after the event', () => {
    const co = buildCountry({ COUNTRY_CODE: 'CO', COUNTRY_NAME: 'Colombia', COUNTRY_ADJECTIVE: 'colombianas' })
    const { description } = priceCheckSnippet(salesEvent('cyber-monday', new Date('2026-12-15T12:00:00Z')), co)
    expect(description).toMatch(/^Cyber Monday fue el lunes, 30 de noviembre\./)
    expect(description).toContain('las tiendas colombianas')
  })
})
