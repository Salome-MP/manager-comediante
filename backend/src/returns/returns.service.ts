import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { OrderStatus, ReturnRequestStatus, NotificationType, CommissionStatus } from '@prisma/client';

@Injectable()
export class ReturnsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  async create(userId: string, data: { orderId: string; reason: string; description?: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.userId !== userId) throw new ForbiddenException('No tienes permiso');
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Solo se pueden solicitar devoluciones en ordenes entregadas');
    }

    // Check if there's already an open return
    const existing = await this.prisma.returnRequest.findFirst({
      where: {
        orderId: data.orderId,
        status: { in: [ReturnRequestStatus.OPEN, ReturnRequestStatus.REVIEWING] },
      },
    });
    if (existing) {
      throw new BadRequestException('Ya existe una solicitud de devolucion abierta para esta orden');
    }

    return this.prisma.returnRequest.create({
      data: {
        orderId: data.orderId,
        userId,
        reason: data.reason,
        description: data.description,
      },
      include: {
        order: { select: { orderNumber: true } },
      },
    });
  }

  async findMyReturns(userId: string) {
    return this.prisma.returnRequest.findMany({
      where: { userId },
      include: {
        order: { select: { id: true, orderNumber: true, total: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(
    page = 1,
    limit = 20,
    filters: { status?: ReturnRequestStatus } = {},
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          order: { select: { id: true, orderNumber: true, total: true, status: true } },
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.returnRequest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, userId?: string, isAdmin = false) {
    const returnReq = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            items: {
              include: {
                artistProduct: { include: { product: { select: { name: true } } } },
              },
            },
          },
        },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!returnReq) throw new NotFoundException('Solicitud no encontrada');
    if (!isAdmin && returnReq.userId !== userId) throw new ForbiddenException('No tienes permiso');

    return returnReq;
  }

  async resolve(
    id: string,
    adminUserId: string,
    data: { status: ReturnRequestStatus; adminNotes?: string; refundOrder?: boolean },
  ) {
    const returnReq = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: true,
        user: { select: { id: true, email: true, firstName: true } },
      },
    });

    if (!returnReq) throw new NotFoundException('Solicitud no encontrada');
    if (returnReq.status !== ReturnRequestStatus.OPEN && returnReq.status !== ReturnRequestStatus.REVIEWING) {
      throw new BadRequestException('Esta solicitud ya fue resuelta');
    }

    const updateData: any = {
      status: data.status,
      adminNotes: data.adminNotes,
      resolvedAt: new Date(),
      resolvedBy: adminUserId,
    };

    const updated = await this.prisma.returnRequest.update({
      where: { id },
      data: updateData,
    });

    // If approved with refund, update order status and cancel commissions
    if (data.status === ReturnRequestStatus.APPROVED && data.refundOrder) {
      await this.prisma.order.update({
        where: { id: returnReq.orderId },
        data: { status: OrderStatus.REFUNDED },
      });

      await this.prisma.commission.updateMany({
        where: { orderId: returnReq.orderId, status: CommissionStatus.PENDING },
        data: { status: CommissionStatus.CANCELLED },
      });
    }

    // Notify customer
    const statusLabel = data.status === ReturnRequestStatus.APPROVED ? 'aprobada' : 'rechazada';
    await this.notificationsService.create({
      userId: returnReq.userId,
      type: NotificationType.RETURN_REQUEST_UPDATE,
      title: `Solicitud de devolucion ${statusLabel}`,
      message: `Tu solicitud de devolucion para el pedido ${returnReq.order.orderNumber} ha sido ${statusLabel}.${data.adminNotes ? ` Nota: ${data.adminNotes}` : ''}`,
      data: { returnId: id, orderId: returnReq.orderId },
    });

    await this.emailService.sendReturnRequestUpdate(returnReq.user.email, {
      customerName: returnReq.user.firstName,
      orderNumber: returnReq.order.orderNumber,
      status: statusLabel,
      adminNotes: data.adminNotes,
    });

    return updated;
  }

  async addImages(id: string, userId: string, imageUrls: string[]) {
    const returnReq = await this.prisma.returnRequest.findUnique({ where: { id } });
    if (!returnReq) throw new NotFoundException('Solicitud no encontrada');
    if (returnReq.userId !== userId) throw new ForbiddenException('No tienes permiso');

    return this.prisma.returnRequest.update({
      where: { id },
      data: { images: [...returnReq.images, ...imageUrls] },
    });
  }
}
