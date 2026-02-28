import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderExpirationService {
  private readonly logger = new Logger(OrderExpirationService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredOrders() {
    const now = new Date();

    // Find expired PENDING orders (no payment, expiresAt passed)
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentId: null,
        expiresAt: { lte: now },
      },
      include: {
        items: { select: { artistProductId: true, quantity: true } },
      },
    });

    if (expiredOrders.length === 0) return;

    for (const order of expiredOrders) {
      await this.prisma.$transaction(async (tx) => {
        // Cancel the order
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        });

        // Restore stock for each item
        for (const item of order.items) {
          await tx.artistProduct.update({
            where: { id: item.artistProductId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });

      this.logger.log(`Cancelled expired order ${order.orderNumber} and restored stock`);
    }

    this.logger.log(`Cancelled ${expiredOrders.length} expired unpaid order(s)`);
  }
}
