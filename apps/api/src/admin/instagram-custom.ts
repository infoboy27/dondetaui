// Validation for "Publicación propia" (POST /admin/instagram/custom). Plain
// module, no Nest imports: the root test run (CI's web job) loads it before
// apps/api's own dependencies are installed.
export const MAX_CAPTION = 2_200 // Instagram's own limit
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // Instagram's limit for feed images

export interface CustomPost {
  target: 'feed' | 'story'
  caption: string
  jpegs: Buffer[]
}

// Throws an Error with a user-facing (Spanish) message on bad input.
export function parseCustomPost(body: { target?: string; caption?: string; imagesBase64?: unknown }): CustomPost {
  const target = body.target === 'story' ? 'story' : 'feed'
  const caption = String(body.caption ?? '').trim()
  if (target === 'feed' && (!caption || caption.length > MAX_CAPTION)) {
    throw new Error('El texto debe tener entre 1 y 2,200 caracteres')
  }
  const images = Array.isArray(body.imagesBase64) ? body.imagesBase64 : []
  const max = target === 'story' ? 1 : 10
  if (images.length < 1 || images.length > max) {
    throw new Error(target === 'story' ? 'Una historia lleva exactamente una imagen' : 'Un post lleva de 1 a 10 imágenes')
  }
  const jpegs = images.map(image => Buffer.from(String(image).replace(/^data:image\/jpeg;base64,/, ''), 'base64'))
  if (jpegs.some(jpeg => jpeg.length < 1_000 || jpeg.length > MAX_IMAGE_BYTES || jpeg[0] !== 0xff || jpeg[1] !== 0xd8)) {
    throw new Error('Cada imagen debe ser un JPEG de menos de 8 MB')
  }
  return { target, caption, jpegs }
}
