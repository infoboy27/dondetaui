import { describe, expect, it } from 'vitest'
import { parseCustomPost } from './instagram-custom'

// A tiny but valid-looking JPEG (starts with FF D8, over the 1 KB floor).
const jpeg = () => Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(2_000, 1)]).toString('base64')
const png = () => Buffer.concat([Buffer.from([0x89, 0x50]), Buffer.alloc(2_000, 1)]).toString('base64')

describe('parseCustomPost (POST /admin/instagram/custom)', () => {
  it('accepts a feed carousel, a single post and a story without caption', () => {
    expect(parseCustomPost({ target: 'feed', caption: ' Eneba × DóndeTa ', imagesBase64: [jpeg(), jpeg(), jpeg()] }))
      .toMatchObject({ target: 'feed', caption: 'Eneba × DóndeTa' })
    expect(parseCustomPost({ target: 'feed', caption: 'x', imagesBase64: [`data:image/jpeg;base64,${jpeg()}`] }).jpegs).toHaveLength(1)
    expect(parseCustomPost({ target: 'story', imagesBase64: [jpeg()] })).toMatchObject({ target: 'story', caption: '' })
  })

  it('rejects what Instagram would reject', () => {
    expect(() => parseCustomPost({ target: 'feed', caption: '', imagesBase64: [jpeg()] })).toThrow(/texto/)
    expect(() => parseCustomPost({ target: 'feed', caption: 'x'.repeat(2_201), imagesBase64: [jpeg()] })).toThrow(/texto/)
    expect(() => parseCustomPost({ target: 'story', imagesBase64: [jpeg(), jpeg()] })).toThrow(/historia/)
    expect(() => parseCustomPost({ target: 'feed', caption: 'x', imagesBase64: Array.from({ length: 11 }, jpeg) })).toThrow(/1 a 10/)
    expect(() => parseCustomPost({ target: 'feed', caption: 'x', imagesBase64: [] })).toThrow(/1 a 10/)
    expect(() => parseCustomPost({ target: 'feed', caption: 'x', imagesBase64: [png()] })).toThrow(/JPEG/)
  })
})
