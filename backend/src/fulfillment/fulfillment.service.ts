import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { OrderStatus, NotificationType } from '@prisma/client';

const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  PAID: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
};

@Injectable()
export class FulfillmentService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  async getBoard() {
    const statuses = [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED];

    const orders = await this.prisma.order.findMany({
      where: { status: { in: statuses } },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: {
          include: {
            artistProduct: { include: { product: { select: { name: true, images: true } }, artist: { select: { stageName: true } } } },
            customizations: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const board = {
      PAID: orders.filter((o) => o.status === OrderStatus.PAID),
      PROCESSING: orders.filter((o) => o.status === OrderStatus.PROCESSING),
      SHIPPED: orders.filter((o) => o.status === OrderStatus.SHIPPED),
    };

    return board;
  }

  async getOrderDetail(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: {
          include: {
            artistProduct: {
              include: {
                product: true,
                artist: { select: { id: true, stageName: true, slug: true } },
              },
            },
            customizations: true,
          },
        },
        commissions: {
          include: { artist: { select: { stageName: true } } },
        },
        returnRequests: {
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  async updateStatus(id: string, newStatus: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true } },
      },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `No se puede cambiar de ${order.status} a ${newStatus}`,
      );
    }

    const data: any = { status: newStatus };

    if (newStatus === OrderStatus.SHIPPED) {
      if (!order.trackingNumber || !order.carrier) {
        throw new BadRequestException(
          'Debes registrar carrier y numero de tracking antes de marcar como enviado',
        );
      }
      data.shippedAt = new Date();
    }

    if (newStatus === OrderStatus.DELIVERED) {
      data.deliveredAt = new Date();
    }

    const updated = await this.prisma.order.update({ where: { id }, data });

    // Send notifications in background (don't block the response)
    if (newStatus === OrderStatus.SHIPPED) {
      this.notificationsService.create({
        userId: order.userId,
        type: NotificationType.ORDER_SHIPPED,
        title: 'Tu pedido esta en camino',
        message: `Tu pedido ${order.orderNumber} ha sido enviado via ${order.carrier}. Tracking: ${order.trackingNumber}`,
        data: { orderId: order.id },
      }).catch(() => {});
      this.emailService.sendOrderShipped(order.user.email, {
        orderNumber: order.orderNumber,
        carrier: order.carrier!,
        trackingNumber: order.trackingNumber!,
        customerName: order.user.firstName,
      }).catch(() => {});
    }

    if (newStatus === OrderStatus.DELIVERED) {
      this.notificationsService.create({
        userId: order.userId,
        type: NotificationType.ORDER_DELIVERED,
        title: 'Tu pedido fue entregado',
        message: `Tu pedido ${order.orderNumber} ha sido entregado. Esperamos que lo disfrutes!`,
        data: { orderId: order.id },
      }).catch(() => {});
      this.emailService.sendOrderDelivered(order.user.email, {
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: order.user.firstName,
      }).catch(() => {});
    }

    return updated;
  }

  async updateShipping(id: string, carrier: string, trackingNumber: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    if (order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException(
        'Solo se puede registrar envio en ordenes en proceso',
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: { carrier, trackingNumber },
    });
  }

  async updateNotes(id: string, fulfillmentNotes: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    return this.prisma.order.update({
      where: { id },
      data: { fulfillmentNotes },
    });
  }

  async getStats() {
    const [paid, processing, shipped, pendingCustomizations] = await Promise.all([
      this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
      this.prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      this.prisma.orderItemCustomization.count({
        where: {
          fulfilled: false,
          orderItem: { order: { status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING] } } },
        },
      }),
    ]);

    return { paid, processing, shipped, pendingCustomizations };
  }
}
