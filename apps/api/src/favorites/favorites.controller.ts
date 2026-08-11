import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard'
import { FavoritesService } from './favorites.service'
import { CreateFavoriteDto } from './favorites.types'

@UseGuards(JwtAuthGuard)
@Controller('me/favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.favorites.list(req.userId)
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateFavoriteDto) {
    return this.favorites.create(req.userId, dto)
  }

  @Delete(':productId')
  @HttpCode(204)
  remove(@Req() req: AuthenticatedRequest, @Param('productId') productId: string) {
    return this.favorites.remove(req.userId, productId)
  }
}
