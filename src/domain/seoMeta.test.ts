import { describe, expect, it, beforeEach } from 'vitest'
import { applySeoMeta, canonicalUrl, isNoindexPath } from './seoMeta'

describe('canonicalUrl', () => {
  it('keeps the home page slash and drops trailing slashes elsewhere', () => {
    expect(canonicalUrl('https://dondeta.com.do', '/')).toBe('https://dondeta.com.do/')
    expect(canonicalUrl('https://dondeta.com.do/', '/privacy/')).toBe('https://dondeta.com.do/privacy')
  })
})

describe('isNoindexPath', () => {
  it('flags private and search routes, not public pages', () => {
    expect(isNoindexPath('/search')).toBe(true)
    expect(isNoindexPath('/cuenta/black-friday')).toBe(true)
    expect(isNoindexPath('/admin/instagram')).toBe(true)
    expect(isNoindexPath('/')).toBe(false)
    expect(isNoindexPath('/privacy')).toBe(false)
    expect(isNoindexPath('/searchlight')).toBe(false)
  })
})

describe('applySeoMeta', () => {
  beforeEach(() => { document.head.innerHTML = '' })

  it('adds a canonical for public routes and removes a stale robots tag', () => {
    applySeoMeta(document, 'https://dondeta.com.do', '/cuenta')
    applySeoMeta(document, 'https://dondeta.com.do', '/eliminar-cuenta')
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://dondeta.com.do/eliminar-cuenta')
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
  })

  it('marks private routes noindex and drops the canonical', () => {
    applySeoMeta(document, 'https://dondeta.com.do', '/')
    applySeoMeta(document, 'https://dondeta.com.do', '/search')
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, follow')
  })
})
