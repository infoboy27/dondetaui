import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Res, UseGuards } from '@nestjs/common'
import { AdminGuard } from './admin.guard'
import { InstagramService } from './instagram.service'

const MAX_CAPTION = 2_200 // Instagram's own limit
const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // Instagram's limit for feed images

@Controller('admin/instagram')
@UseGuards(AdminGuard)
export class InstagramAdminController {
  constructor(private readonly instagram: InstagramService) {}

  @Get('status')
  status() {
    return this.instagram.status()
  }

  @Get('posts')
  history() {
    return this.instagram.history()
  }

  @Post('posts')
  async publish(@Body() body: { productId?: string; kind?: string; caption?: string; imageBase64?: string; force?: boolean }) {
    const kind = body.kind === 'drop' ? 'drop' : body.kind === 'comparison' ? 'comparison' : null
    if (!kind) throw new BadRequestException('kind inválido')
    const caption = String(body.caption ?? '').trim()
    if (!caption || caption.length > MAX_CAPTION) throw new BadRequestException('El texto debe tener entre 1 y 2,200 caracteres')
    const productId = body.productId && /^[0-9a-f-]{36}$/i.test(body.productId) ? body.productId : null
    const jpeg = Buffer.from(String(body.imageBase64 ?? '').replace(/^data:image\/jpeg;base64,/, ''), 'base64')
    // Instagram only accepts JPEG for feed photos.
    if (jpeg.length < 1_000 || jpeg.length > MAX_IMAGE_BYTES || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) {
      throw new BadRequestException('La imagen debe ser un JPEG de menos de 8 MB')
    }
    const publicBaseUrl = (process.env.SITE_URL ?? '').replace(/\/+$/, '')
    if (!/^https:\/\//.test(publicBaseUrl)) throw new BadRequestException('SITE_URL (https) no está configurado en la API')
    return this.instagram.publish({ productId, kind, caption, jpeg, publicBaseUrl, force: Boolean(body.force) })
  }
}

// Public on purpose: Instagram's servers download the photo from here while
// publishing. Ids are random UUIDs, and only post images are ever served.
@Controller('ig-media')
export class InstagramMediaController {
  constructor(private readonly instagram: InstagramService) {}

  @Get(':file')
  async image(
    @Param('file') file: string,
    @Res() res: { status(code: number): { end(): void }; setHeader(name: string, value: string): void; end(body: Buffer): void },
  ) {
    const id = /^([0-9a-f-]{36})\.jpg$/i.exec(file)?.[1]
    if (!id) throw new NotFoundException()
    const image = await this.instagram.image(id)
    if (!image) throw new NotFoundException()
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.end(image)
  }
}
