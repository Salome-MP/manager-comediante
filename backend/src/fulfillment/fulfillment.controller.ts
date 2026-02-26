import {
  Controller, Get, Patch, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FulfillmentService } from './fulfillment.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';
import { UpdateNotesDto } from './dto/update-notes.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Fulfillment')
@Controller('fulfillment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.STAFF)
export class FulfillmentController {
  constructor(private fulfillmentService: FulfillmentService) {}

  @Get('board')
  @ApiOperation({ summary: 'Tablero de ordenes agrupadas por status' })
  getBoard() {
    return this.fulfillmentService.getBoard();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadisticas de fulfillment' })
  getStats() {
    return this.fulfillmentService.getStats();
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Detalle completo de una orden' })
  getOrderDetail(@Param('id') id: string) {
    return this.fulfillmentService.getOrderDetail(id);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Cambiar status de orden con validacion' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.fulfillmentService.updateStatus(id, dto.status);
  }

  @Patch('orders/:id/shipping')
  @ApiOperation({ summary: 'Registrar datos de envio' })
  updateShipping(@Param('id') id: string, @Body() dto: UpdateShippingDto) {
    return this.fulfillmentService.updateShipping(id, dto.carrier, dto.trackingNumber);
  }

  @Patch('orders/:id/notes')
  @ApiOperation({ summary: 'Actualizar notas internas' })
  updateNotes(@Param('id') id: string, @Body() dto: UpdateNotesDto) {
    return this.fulfillmentService.updateNotes(id, dto.fulfillmentNotes);
  }
}
