import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class TicketExpirationService {
  private readonly logger = new Logger(TicketExpirationService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredTickets() {
    const now = new Date();

    const result = await this.prisma.ticket.updateMany({
      where: {
        status: TicketStatus.ACTIVE,
        paymentId: null,
        expiresAt: { lte: now },
      },
      data: { status: TicketStatus.CANCELLED },
    });

    if (result.count > 0) {
      this.logger.log(`Cancelled ${result.count} expired unpaid ticket(s)`);
    }
  }
}
