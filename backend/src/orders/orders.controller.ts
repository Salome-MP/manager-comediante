import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { ReceiptService } from './receipt.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, OrderStatus, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private receiptService: ReceiptService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  // --- USER ENDPOINTS ---

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear orden desde el carrito del usuario' })
  createFromCart(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createFromCart(userId, dto);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar órdenes del usuario autenticado' })
  findByUser(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findByUser(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id/receipt')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Descargar boleta/factura en PDF' })
  async getReceipt(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
    @Res() res: Response,
  ) {
    const order = await this.ordersService.findOne(id);
    const isAdmin = user.role === Role.SUPER_ADMIN || user.role === Role.STAFF;
    if (order.userId !== user.id && !isAdmin) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    const pdfBuffer = await this.receiptService.generateReceipt(id);
    const filename = `${order.orderNumber}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ver detalle de una orden (dueño o admin)' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    const order = await this.ordersService.findOne(id);

    // Verify the user owns the order or is admin/staff
    const isAdmin = user.role === Role.SUPER_ADMIN || user.role === Role.STAFF;
    if (order.userId !== user.id && !isAdmin) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    return order;
  }

  // --- ADMIN ENDPOINTS ---

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Listar todas las órdenes (Admin)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
    @Query('artistId') artistId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('search') search?: string,
  ) {
    return this.ordersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { status, artistId, fromDate, toDate, search },
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Actualizar estado de una orden (Admin)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  @Patch(':id/simulate-payment')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Simular pago para pruebas' })
  async simulatePayment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            artistProduct: { include: { product: true, artist: true } },
            customizations: true,
          },
        },
        referral: { include: { owner: true } },
      },
    });

    if (!order) throw new BadRequestException('Orden no encontrada');
    if (order.userId !== userId) throw new ForbiddenException('No tienes acceso');
    if (order.status !== 'PENDING') throw new BadRequestException('La orden ya fue procesada');

    // Mark as PAID and clear expiration
    await this.prisma.order.update({
      where: { id },
      data: { status: 'PAID', paymentId: 'SIMULATED', paymentMethod: 'test', expiresAt: null },
    });

    // Create artist commissions (distribute coupon discount proportionally)
    const orderSubtotal = Number(order.subtotal);
    const orderDiscount = Number(order.discount || 0);
    const discountRatio = orderSubtotal > 0 ? orderDiscount / orderSubtotal : 0;

    for (const item of order.items) {
      const effectivePrice = Number(item.unitPrice) * (1 - discountRatio);
      const margin = effectivePrice - Number(item.artistProduct.product.manufacturingCost);
      const rate = Number(item.artistProduct.artistCommission);
      const amount = Math.max(0, (margin * rate / 100) * item.quantity);
      if (amount > 0) {
        await this.prisma.commission.create({
          data: { orderId: order.id, amount: Math.round(amount * 100) / 100, rate, type: 'artist', artistId: item.artistProduct.artistId },
        });
      }

      // Customization commission (100% goes to artist)
      const custTotal = item.customizations.reduce((sum, c) => sum + Number(c.price), 0);
      if (custTotal > 0) {
        await this.prisma.commission.create({
          data: { orderId: order.id, amount: Math.round(custTotal * 100) / 100, rate: 100, type: 'customization', artistId: item.artistProduct.artistId },
        });
      }

      // Notify artist
      await this.notificationsService.create({
        userId: item.artistProduct.artist.userId,
        type: NotificationType.NEW_SALE,
        title: 'Nueva venta!',
        message: `Se vendio "${item.artistProduct.product.name}" x${item.quantity} en el pedido ${order.orderNumber}.`,
        data: { orderId: order.id },
      });
    }

    // Referral commission (based on discounted subtotal)
    if (order.referral) {
      const effectiveSubtotal = Number(order.subtotal) - Number(order.discount || 0);
      const refAmount = effectiveSubtotal * Number(order.referral.commissionRate) / 100;
      if (refAmount > 0) {
        await this.prisma.commission.create({
          data: { orderId: order.id, amount: refAmount, rate: Number(order.referral.commissionRate), type: 'referral', referralId: order.referral.id },
        });
      }
    }

    // Notify buyer
    await this.notificationsService.create({
      userId: order.userId,
      type: NotificationType.ORDER_CONFIRMATION,
      title: 'Pedido confirmado!',
      message: `Tu pedido ${order.orderNumber} ha sido pagado exitosamente.`,
      data: { orderId: order.id },
    });

    // Send order confirmation email
    await this.emailService.sendOrderConfirmation(order.user.email, {
      id: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      items: order.items.map((i) => ({
        name: i.artistProduct.product.name,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
      })),
    });

    return { message: 'Pago simulado exitosamente', status: 'PAID' };
  }
}
