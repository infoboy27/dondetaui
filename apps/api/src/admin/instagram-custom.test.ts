import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BadRequestException } from '@nestjs/common'
import { InstagramAdminController } from './instagram.controller'
import type { InstagramService } from './instagram.service'

// A tiny but valid-looking JPEG (starts with FF D8, over the 1 KB floor).
const jpeg = () => Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(2_000, 1)]).toString('base64')
const png = () => Buffer.concat([Buffer.from([0x89, 0x50]), Buffer.alloc(2_000, 1)]).toString('base64')

describe('POST /admin/instagram/custom', () => {
  const publishPost = vi.fn(() => Promise.resolve({ id: 'x', status: 'published', permalink: null }))
  const controller = new InstagramAdminController({ publishPost } as unknown as InstagramService)

  beforeEach(() => { process.env.SITE_URL = 'https://dondeta.com.do' })
  afterEach(() => { publishPost.mockClear() })

  it('publishes several images as a carousel promo, in the background', () => {
    const result = controller.publishCustom({ target: 'feed', caption: 'Eneba × DóndeTa', imagesBase64: [jpeg(), jpeg(), jpeg()] })
    expect(result).toEqual({ status: 'publishing' })
    expect(publishPost).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'promo', target: 'feed', format: 'carousel', productId: null, caption: 'Eneba × DóndeTa',
    }))
    expect((publishPost.mock.calls[0] as unknown as [{ media: unknown[] }])[0].media).toHaveLength(3)
  })

  it('publishes a single image as a plain post, and a story without caption', () => {
    controller.publishCustom({ target: 'feed', caption: 'Hola', imagesBase64: [jpeg()] })
    controller.publishCustom({ target: 'story', imagesBase64: [jpeg()] })
    expect(publishPost.mock.calls.map(call => (call as unknown as [{ format: string; target: string }])[0]).map(c => `${c.target}/${c.format}`))
      .toEqual(['feed/image', 'story/image'])
  })

  it('rejects what Instagram would reject', () => {
    expect(() => controller.publishCustom({ target: 'feed', caption: '', imagesBase64: [jpeg()] })).toThrow(BadRequestException)
    expect(() => controller.publishCustom({ target: 'story', imagesBase64: [jpeg(), jpeg()] })).toThrow(BadRequestException)
    expect(() => controller.publishCustom({ target: 'feed', caption: 'x', imagesBase64: Array.from({ length: 11 }, jpeg) })).toThrow(BadRequestException)
    expect(() => controller.publishCustom({ target: 'feed', caption: 'x', imagesBase64: [png()] })).toThrow(BadRequestException)
    expect(publishPost).not.toHaveBeenCalled()
  })
})
