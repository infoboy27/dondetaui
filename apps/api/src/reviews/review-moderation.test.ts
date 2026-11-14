import { describe, expect, it } from 'vitest'
import { hasObjectionableContent, reportAlertMessage, reportReason, shouldAutoHide } from './review-moderation'

describe('hasObjectionableContent', () => {
  it('catches insults and slurs, including accents, caps, repeats and leetspeak', () => {
    expect(hasObjectionableContent('Esta nevera es una mierda')).toBe(true)
    expect(hasObjectionableContent('el vendedor es un PENDEJOOO')).toBe(true)
    expect(hasObjectionableContent('M1erda de servicio')).toBe(true)
    expect(hasObjectionableContent('Maricón el que lo compre')).toBe(true)
    expect(hasObjectionableContent('mmg que caro')).toBe(true)
    expect(hasObjectionableContent('te voy a matar')).toBe(true)
  })

  it('leaves normal reviews alone, including words that contain a blocked one', () => {
    expect(hasObjectionableContent('Buena calidad, llegó rápido. Cartera de cuero muy bonita.')).toBe(false)
    expect(hasObjectionableContent('La computadora es excelente')).toBe(false)
    expect(hasObjectionableContent('Disputa con la tienda por la garantía')).toBe(false)
    expect(hasObjectionableContent('Maldito precio, subió el doble')).toBe(false)
    expect(hasObjectionableContent('')).toBe(false)
    expect(hasObjectionableContent(null)).toBe(false)
  })
})

describe('reports', () => {
  it('hides a review automatically at 3 reports', () => {
    expect(shouldAutoHide(2)).toBe(false)
    expect(shouldAutoHide(3)).toBe(true)
  })

  it('accepts known reasons and maps the rest to "other"', () => {
    expect(reportReason('spam')).toBe('spam')
    expect(reportReason('<script>')).toBe('other')
    expect(reportReason(undefined)).toBe('other')
  })

  it('builds the Discord alert with an excerpt and the auto-hide note', () => {
    const message = reportAlertMessage({ productName: 'Nevera LG', comment: 'texto   de la reseña', reason: 'offensive', reports: 3, hidden: true })
    expect(message).toContain('Reseña reportada (ofensiva) en "Nevera LG"')
    expect(message).toContain('"texto de la reseña"')
    expect(message).toContain('se ocultó automáticamente')
  })
})
