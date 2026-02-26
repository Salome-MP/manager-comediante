import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener carrito del usuario autenticado' })
  getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Agregar item al carrito' })
  addItem(@CurrentUser('id') userId: string, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(userId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Actualizar cantidad de un item del carrito' })
  updateItemQuantity(
    @CurrentUser('id') userId: string,
    @Param('id') cartItemId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateItemQuantity(userId, cartItemId, quantity);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Eliminar item del carrito' })
  removeItem(
    @CurrentUser('id') userId: string,
    @Param('id') cartItemId: string,
  ) {
    return this.cartService.removeItem(userId, cartItemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Vaciar carrito completo' })
  clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
