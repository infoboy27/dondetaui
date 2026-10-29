import { BadRequestException, Body, Controller, Delete, Get, Header, Logger, NotFoundException, OnModuleDestroy, OnModuleInit, Param, Post, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../admin/admin.guard'
import { dominicanToday, parseCardPromotion } from './card-promotion-input'
import { CardPromotionsRepository } from './card-promotions.repository'

const CLEANUP_EVERY_MS = 6 * 3_600_000

@Controller()
export class CardPromotionsController implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('CardPromotions')
  private cleanup?: NodeJS.Timeout

  constructor(private readonly promotions: CardPromotionsRepository) {}

  // Expired promotions are already hidden by date; this deletes them so the
  // table only ever holds current and upcoming ones.
  onModuleInit() {
    const run = () => {
      this.promotions.deleteExpired(dominicanToday())
        .then(count => { if (count) this.logger.log(`Deleted ${count} expired card promotion(s)`) })
        .catch(error => this.logger.warn(`Cleanup failed: ${error instanceof Error ? error.message : error}`))
    }
    run()
    this.cleanup = setInterval(run, CLEANUP_EVERY_MS)
    this.cleanup.unref()
  }

  onModuleDestroy() {
    clearInterval(this.cleanup)
  }

  @Get('card-promotions')
  @Header('Cache-Control', 'public, max-age=300')
  active() {
    return this.promotions.active(dominicanToday())
  }

  @Get('admin/card-promotions')
  @UseGuards(AdminGuard)
  list() {
    return this.promotions.notExpired(dominicanToday())
  }

  @Post('admin/card-promotions')
  @UseGuards(AdminGuard)
  async create(@Body() body: Record<string, unknown>) {
    let input
    try {
      input = parseCardPromotion(body ?? {}, dominicanToday())
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Datos inválidos')
    }
    const created = await this.promotions.create(input)
    if (!created) throw new BadRequestException('Esa tienda no existe')
    return created
  }

  @Delete('admin/card-promotions/:id')
  @UseGuards(AdminGuard)
  async remove(@Param('id') id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BadRequestException('Invalid id')
    if (!(await this.promotions.remove(id))) throw new NotFoundException('Promotion not found')
    return { ok: true }
  }
}
