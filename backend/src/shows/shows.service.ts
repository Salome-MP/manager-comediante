import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShowStatus, TicketStatus, NotificationType } from '@prisma/client';
import { CreateShowDto } from './dto/create-show.dto';
import { UpdateShowDto } from './dto/update-show.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ShowsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ==========================================
  // CRUD
  // ==========================================

  async create(dto: CreateShowDto) {
    const slug = this.generateSlug(dto.name);

    const show = await this.prisma.show.create({
      data: {
        artistId: dto.artistId,
        name: dto.name,
        slug,
        description: dto.description,
        venue: dto.venue,
        address: dto.address,
        city: dto.city,
        date: dto.date,
        endDate: dto.endDate,
        image: dto.image,
        ticketPrice: dto.ticketPrice,
        platformFee: dto.platformFee ?? 10,
        totalCapacity: dto.totalCapacity,
        ticketsEnabled: dto.ticketsEnabled ?? true,
        publishAt: dto.publishAt,
      },
      include: {
        artist: {
          select: { id: true, stageName: true, slug: true, profileImage: true },
        },
      },
    });

    // Notify followers about new show (only if published immediately)
    this.notifications.notifyFollowers(
      dto.artistId,
      NotificationType.NEW_SHOW,
      `Nuevo show de ${show.artist.stageName}`,
      `${show.name} - ${show.venue}, ${new Date(show.date).toLocaleDateString('es-PE')}`,
      { showId: show.id, artistSlug: show.artist.slug },
    ).catch(() => {}); // Fire and forget

    return show;
  }

  async findAll(
    page = 1,
    limit = 20,
    filters: {
      search?: string;
      status?: ShowStatus;
      artistId?: string;
    } = {},
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.artistId) {
      where.artistId = filters.artistId;
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { venue: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { artist: { stageName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [shows, total] = await Promise.all([
      this.prisma.show.findMany({
        where,
        skip,
        take: limit,
        include: {
          artist: {
            select: { id: true, stageName: true, slug: true, profileImage: true },
          },
          _count: { select: { tickets: true } },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.show.count({ where }),
    ]);

    return { data: shows, total, page, limit };
  }

  async findUpcoming(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const now = new Date();

    const [shows, total] = await Promise.all([
      this.prisma.show.findMany({
        where: {
          status: ShowStatus.SCHEDULED,
          date: { gte: now },
          OR: [{ publishAt: null }, { publishAt: { lte: now } }],
        },
        skip,
        take: limit,
        include: {
          artist: {
            select: { id: true, stageName: true, slug: true, profileImage: true },
          },
          _count: { select: { tickets: true } },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.show.count({
        where: {
          status: ShowStatus.SCHEDULED,
          date: { gte: now },
          OR: [{ publishAt: null }, { publishAt: { lte: now } }],
        },
      }),
    ]);

    return { data: shows, total, page, limit };
  }

  async findByArtist(artistId: string) {
    return this.prisma.show.findMany({
      where: { artistId },
      include: {
        artist: {
          select: { id: true, stageName: true, slug: true, profileImage: true },
        },
        _count: { select: { tickets: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const show = await this.prisma.show.findUnique({
      where: { id },
      include: {
        artist: {
          select: { id: true, stageName: true, slug: true, profileImage: true },
        },
        _count: { select: { tickets: true } },
      },
    });

    if (!show) {
      throw new NotFoundException('Show no encontrado');
    }

    return show;
  }

  async findBySlug(slug: string) {
    const show = await this.prisma.show.findUnique({
      where: { slug },
      include: {
        artist: {
          select: { id: true, stageName: true, slug: true, profileImage: true },
        },
        mediaItems: { orderBy: { createdAt: 'desc' } },
        _count: { select: { tickets: true } },
      },
    });

    if (!show) {
      throw new NotFoundException('Show no encontrado');
    }

    return show;
  }

  async update(id: string, dto: UpdateShowDto) {
    const show = await this.prisma.show.findUnique({ where: { id } });
    if (!show) {
      throw new NotFoundException('Show no encontrado');
    }

    const data: any = { ...dto };

    // Regenerar slug si el nombre cambió
    if (dto.name && dto.name !== show.name) {
      data.slug = this.generateSlug(dto.name);
    }

    return this.prisma.show.update({
      where: { id },
      data,
      include: {
        artist: {
          select: { id: true, stageName: true, slug: true, profileImage: true },
        },
      },
    });
  }

  async cancel(id: string) {
    const show = await this.prisma.show.findUnique({
      where: { id },
      include: {
        artist: {
          select: { id: true, stageName: true, slug: true, profileImage: true },
        },
        tickets: {
          where: { status: TicketStatus.ACTIVE },
          include: { user: { select: { id: true, email: true, firstName: true } } },
        },
      },
    });
    if (!show) {
      throw new NotFoundException('Show no encontrado');
    }

    // Cancel show + all active tickets in a transaction
    const paidTickets = show.tickets.filter((t) => t.paymentId);
    const affectedUserIds = [...new Set(show.tickets.map((t) => t.user.id))];

    await this.prisma.$transaction(async (tx) => {
      // Mark show as cancelled
      await tx.show.update({
        where: { id },
        data: { status: ShowStatus.CANCELLED },
      });

      // Cancel all active tickets
      if (show.tickets.length > 0) {
        await tx.ticket.updateMany({
          where: { showId: id, status: TicketStatus.ACTIVE },
          data: { status: TicketStatus.CANCELLED },
        });
      }
    });

    // Notify affected users (fire and forget)
    for (const userId of affectedUserIds) {
      this.notifications.create({
        userId,
        type: NotificationType.GENERAL,
        title: 'Show cancelado',
        message: `El show "${show.name}" ha sido cancelado.${paidTickets.some((t) => t.userId === userId) ? ' Tu entrada será reembolsada.' : ''}`,
        data: { showId: show.id },
      }).catch(() => {});
    }

    return {
      ...show,
      status: ShowStatus.CANCELLED,
      cancelledTickets: show.tickets.length,
      paidTicketsToRefund: paidTickets.length,
    };
  }

  async remove(id: string) {
    const show = await this.prisma.show.findUnique({
      where: { id },
      include: { _count: { select: { tickets: true } } },
    });
    if (!show) {
      throw new NotFoundException('Show no encontrado');
    }
    if (show._count.tickets > 0) {
      throw new BadRequestException(
        'No se puede eliminar un show que tiene tickets vendidos. Cancela el show en su lugar.',
      );
    }
    await this.prisma.show.delete({ where: { id } });
    return { message: 'Show eliminado exitosamente' };
  }

  // ==========================================
  // SCHEDULING
  // ==========================================

  async getScheduledByArtist(artistId: string) {
    const now = new Date();
    return this.prisma.show.findMany({
      where: {
        artistId,
        publishAt: { gt: now },
      },
      include: {
        artist: {
          select: { id: true, stageName: true, slug: true, profileImage: true },
        },
      },
      orderBy: { publishAt: 'asc' },
    });
  }

  async setPublishDate(id: string, publishAt: string | null) {
    const show = await this.prisma.show.findUnique({ where: { id } });
    if (!show) throw new NotFoundException('Show no encontrado');
    return this.prisma.show.update({
      where: { id },
      data: { publishAt: publishAt ? new Date(publishAt) : null },
      include: {
        artist: {
          select: { id: true, stageName: true, slug: true, profileImage: true },
        },
      },
    });
  }

  // ==========================================
  // TICKETS
  // ==========================================

  async purchaseTicket(userId: string, showId: string) {
    const show = await this.prisma.show.findUnique({
      where: { id: showId },
      include: {
        artist: { select: { userId: true } },
        _count: { select: { tickets: true } },
      },
    });

    if (!show) {
      throw new NotFoundException('Show no encontrado');
    }

    // Artist cannot buy tickets for their own show
    if (show.artist.userId === userId) {
      throw new BadRequestException('No puedes comprar entradas para tu propio show');
    }

    if (show.status !== ShowStatus.SCHEDULED) {
      throw new BadRequestException('El show no esta disponible para compra de tickets');
    }

    if (!show.ticketsEnabled) {
      throw new BadRequestException('La venta de tickets no esta habilitada para este show');
    }

    // Count only active (paid) tickets for capacity check
    const activeTicketCount = await this.prisma.ticket.count({
      where: { showId, status: { not: TicketStatus.CANCELLED } },
    });

    if (show.totalCapacity && activeTicketCount >= show.totalCapacity) {
      throw new BadRequestException('No hay tickets disponibles, el show esta agotado');
    }

    // Check if user already has a paid ticket for this show
    const existingPaid = await this.prisma.ticket.findFirst({
      where: { showId, userId, status: TicketStatus.ACTIVE, paymentId: { not: null } },
    });
    if (existingPaid) {
      throw new BadRequestException('Ya compraste una entrada para este show');
    }

    // Check if user already has an unpaid ticket for this show
    const existingUnpaid = await this.prisma.ticket.findFirst({
      where: { showId, userId, status: TicketStatus.ACTIVE, paymentId: null },
    });
    if (existingUnpaid) {
      // Return existing unpaid ticket instead of creating a new one
      return {
        ...existingUnpaid,
        show: { id: show.id, name: show.name, venue: show.venue, date: show.date },
        message: 'Ya tienes un ticket pendiente de pago para este show',
      };
    }

    const qrCode = `TICKET-${showId}-${randomUUID()}`;

    const ticket = await this.prisma.ticket.create({
      data: {
        showId,
        userId,
        qrCode,
        price: show.ticketPrice || 0,
      },
      include: {
        show: {
          select: { id: true, name: true, venue: true, date: true },
        },
      },
    });

    return { ...ticket, qrCode };
  }

  // TODO: Remove in production — simulates payment without Mercado Pago
  async simulateTicketPayment(userId: string, showId: string) {
    // Create ticket if not exists
    const ticketResult = await this.purchaseTicket(userId, showId);

    // Get show with platform fee info
    const show = await this.prisma.show.findUnique({
      where: { id: showId },
      include: { artist: { select: { id: true, stageName: true } } },
    });

    // Mark as paid with a simulated payment ID
    const paid = await this.prisma.ticket.update({
      where: { id: ticketResult.id },
      data: { paymentId: `SIM-${Date.now()}` },
      include: {
        show: {
          select: { id: true, name: true, venue: true, date: true },
        },
      },
    });

    // Create artist commission for this ticket
    if (show && show.ticketPrice) {
      const ticketPrice = Number(show.ticketPrice);
      const platformFeeRate = Number(show.platformFee);
      const artistRate = 100 - platformFeeRate;
      const artistAmount = Math.round(ticketPrice * artistRate) / 100;

      if (artistAmount > 0) {
        await this.prisma.commission.create({
          data: {
            ticketId: paid.id,
            amount: artistAmount,
            rate: artistRate,
            type: 'ticket',
            artistId: show.artist.id,
          },
        });
      }
    }

    return { ...paid, message: 'Pago simulado exitosamente' };
  }

  async getTicketsByShow(showId: string) {
    const show = await this.prisma.show.findUnique({ where: { id: showId } });
    if (!show) {
      throw new NotFoundException('Show no encontrado');
    }

    return this.prisma.ticket.findMany({
      where: { showId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTicketsByUser(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      include: {
        show: {
          include: {
            artist: {
              select: { id: true, stageName: true, slug: true, profileImage: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async validateTicket(qrCode: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        show: {
          select: { id: true, name: true, venue: true, date: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    if (ticket.status === TicketStatus.USED) {
      throw new BadRequestException('Este ticket ya fue utilizado');
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      throw new BadRequestException('Este ticket fue cancelado');
    }

    if (!ticket.paymentId) {
      throw new BadRequestException('Este ticket no ha sido pagado');
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.USED },
      include: {
        show: {
          select: { id: true, name: true, venue: true, date: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return updatedTicket;
  }

  // ==========================================
  // PUBLIC TICKET VERIFICATION (read-only)
  // ==========================================

  async verifyTicketPublic(qrCode: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        show: {
          select: {
            id: true,
            name: true,
            slug: true,
            venue: true,
            address: true,
            city: true,
            date: true,
            image: true,
            status: true,
            artist: {
              select: { id: true, stageName: true, slug: true, profileImage: true },
            },
          },
        },
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Entrada no encontrada');
    }

    return {
      ticketId: ticket.id,
      status: ticket.status,
      price: ticket.price,
      isPaid: !!ticket.paymentId,
      purchasedAt: ticket.createdAt,
      buyerName: `${ticket.user.firstName} ${ticket.user.lastName}`,
      show: ticket.show,
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const suffix = randomUUID().slice(0, 4);
    return `${base}-${suffix}`;
  }
}
