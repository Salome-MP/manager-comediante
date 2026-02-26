import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Wishlist')
@Controller('wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener wishlist del usuario' })
  getWishlist(@CurrentUser('id') userId: string) {
    return this.wishlistService.getWishlist(userId);
  }

  @Get('ids')
  @ApiOperation({ summary: 'Obtener IDs de productos en wishlist' })
  getIds(@CurrentUser('id') userId: string) {
    return this.wishlistService.getIds(userId);
  }

  @Post('toggle/:artistProductId')
  @ApiOperation({ summary: 'Agregar/quitar producto de la wishlist' })
  toggle(
    @CurrentUser('id') userId: string,
    @Param('artistProductId') artistProductId: string,
  ) {
    return this.wishlistService.toggle(userId, artistProductId);
  }

  @Get('check/:artistProductId')
  @ApiOperation({ summary: 'Verificar si un producto esta en la wishlist' })
  check(
    @CurrentUser('id') userId: string,
    @Param('artistProductId') artistProductId: string,
  ) {
    return this.wishlistService.check(userId, artistProductId);
  }
}
