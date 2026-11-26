import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard'
import { MAX_SAVED_SEARCHES, isUuid, parseSavedSearchInput } from './saved-search-input'
import { SavedSearchesRepository } from './saved-searches.repository'

// Saved searches (the saved_search notification): the alerts worker tells
// the user when a matching product appears or drops under the max price.
@UseGuards(JwtAuthGuard)
@Controller('me/saved-searches')
export class SavedSearchesController {
  constructor(private readonly searches: SavedSearchesRepository) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.searches.list(req.userId)
  }

  @Post()
  async save(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = parseSavedSearchInput(body)
    if (!parsed.ok) throw new BadRequestException(parsed.error)
    const isNew = !(await this.searches.exists(req.userId, parsed.value.query))
    if (isNew && (await this.searches.count(req.userId)) >= MAX_SAVED_SEARCHES) {
      throw new BadRequestException(`Puedes guardar hasta ${MAX_SAVED_SEARCHES} búsquedas. Borra alguna en Perfil › Notificaciones.`)
    }
    return this.searches.save(req.userId, parsed.value)
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    if (!isUuid(id)) throw new BadRequestException('Esa búsqueda no existe.')
    await this.searches.remove(req.userId, id)
  }
}
