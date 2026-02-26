import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { Role, CustomizationType, CustomizationStatus, NotificationType } from '@prisma/client';

@Injectable()
export class ArtistsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  async create(dto: CreateArtistDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const slug = this.generateSlug(dto.stageName);
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: Role.ARTIST,
        artist: {
          create: {
            stageName: dto.stageName,
            slug,
            tagline: dto.tagline,
            biography: dto.biography,
            commissionRate: dto.commissionRate || 50,
          },
        },
      },
      include: { artist: true },
    });

    return {
      id: user.artist!.id,
      userId: user.id,
      email: user.email,
      stageName: user.artist!.stageName,
      slug: user.artist!.slug,
      tagline: user.artist!.tagline,
      biography: user.artist!.biography,
      commissionRate: user.artist!.commissionRate,
    };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [artists, total] = await Promise.all([
      this.prisma.artist.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          _count: { select: { artistProducts: true, shows: true, followers: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.artist.count(),
    ]);

    return { data: artists, total, page, limit };
  }

  async findAllPublic(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { isActive: true, isApproved: true };
    const [artists, total] = await Promise.all([
      this.prisma.artist.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          stageName: true,
          slug: true,
          tagline: true,
          profileImage: true,
          isFeatured: true,
          _count: { select: { followers: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.artist.count({ where }),
    ]);

    return { data: artists, total, page, limit };
  }

  async findBySlug(slug: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { slug, isActive: true, isApproved: true },
      include: {
        artistProducts: {
          where: { isActive: true },
          include: { product: { include: { category: true } } },
          orderBy: { isFeatured: 'desc' },
          take: 8,
        },
        shows: {
          orderBy: { date: 'desc' },
          take: 10,
          include: { mediaItems: { where: { type: 'image' }, orderBy: { createdAt: 'desc' }, take: 6 } },
        },
        mediaItems: { orderBy: { sortOrder: 'asc' }, take: 12 },
        customizations: { where: { isActive: true } },
        _count: { select: { followers: true } },
      },
    });

    if (!artist) throw new NotFoundException('Artista no encontrado');
    return artist;
  }

  async findOne(id: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        _count: { select: { artistProducts: true, shows: true, followers: true } },
      },
    });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    return artist;
  }

  async update(id: string, dto: UpdateArtistDto) {
    const artist = await this.prisma.artist.findUnique({ where: { id } });
    if (!artist) throw new NotFoundException('Artista no encontrado');

    const data: any = { ...dto };
    if (dto.stageName && dto.stageName !== artist.stageName) {
      data.slug = this.generateSlug(dto.stageName);
    }

    return this.prisma.artist.update({ where: { id }, data });
  }

  async toggleActive(id: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id } });
    if (!artist) throw new NotFoundException('Artista no encontrado');

    return this.prisma.artist.update({
      where: { id },
      data: { isActive: !artist.isActive },
    });
  }

  async followArtist(userId: string, artistId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');

    const existing = await this.prisma.artistFollower.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });

    if (existing) {
      await this.prisma.artistFollower.delete({ where: { id: existing.id } });
      return { following: false };
    }

    await this.prisma.artistFollower.create({ data: { userId, artistId } });
    return { following: true };
  }

  // ─── CUSTOMIZATIONS ────────────────────────────────────

  async getCustomizations(artistId: string) {
    return this.prisma.artistCustomization.findMany({
      where: { artistId },
      orderBy: { type: 'asc' },
    });
  }

  async upsertCustomization(
    artistId: string,
    userId: string,
    data: { type: CustomizationType; price: number; description?: string; isActive?: boolean },
  ) {
    // Verify the artist belongs to this user
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('No tienes permiso');

    return this.prisma.artistCustomization.upsert({
      where: { artistId_type: { artistId, type: data.type } },
      update: {
        price: data.price,
        description: data.description,
        isActive: data.isActive ?? true,
      },
      create: {
        artistId,
        type: data.type,
        price: data.price,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
  }

  async deleteCustomization(artistId: string, userId: string, customizationId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('No tienes permiso');

    return this.prisma.artistCustomization.delete({
      where: { id: customizationId },
    });
  }

  async fulfillOrderCustomization(
    artistId: string,
    userId: string,
    customizationId: string,
    data?: { attachmentUrl?: string; notes?: string; meetingLink?: string; scheduledDate?: string },
  ) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('No tienes permiso');

    // For VIDEO_CALL, validate scheduled date has passed
    const existing = await this.prisma.orderItemCustomization.findUnique({
      where: { id: customizationId },
    });
    if (!existing) throw new NotFoundException('Personalizacion no encontrada');

    if (existing.type === CustomizationType.VIDEO_CALL) {
      if (!existing.scheduledDate) {
        throw new BadRequestException('La videollamada aun no ha sido agendada por el cliente');
      }
      if (new Date(existing.scheduledDate) > new Date()) {
        throw new BadRequestException('La videollamada aun no ha llegado a su fecha programada');
      }
    }

    const customization = await this.prisma.orderItemCustomization.update({
      where: { id: customizationId },
      data: {
        fulfilled: true,
        status: CustomizationStatus.COMPLETED,
        fulfilledAt: new Date(),
        fulfilledBy: userId,
        attachmentUrl: data?.attachmentUrl,
        notes: data?.notes,
        meetingLink: data?.meetingLink,
        scheduledDate: data?.scheduledDate ? new Date(data.scheduledDate) : undefined,
      },
      include: {
        orderItem: {
          include: {
            order: {
              include: { user: { select: { id: true, email: true, firstName: true } } },
            },
            artistProduct: { include: { product: { select: { name: true } } } },
          },
        },
      },
    });

    // Notify the customer (in background — don't block response)
    const order = customization.orderItem.order;
    const typeLabel = this.getCustomizationLabel(customization.type);

    this.notificationsService.create({
      userId: order.userId,
      type: NotificationType.CUSTOMIZATION_FULFILLED,
      title: `Tu ${typeLabel} esta listo!`,
      message: `${artist.stageName} ha completado tu ${typeLabel} del pedido ${order.orderNumber}.`,
      data: { orderId: order.id, customizationId },
    }).catch(() => {});

    this.emailService.sendCustomizationFulfilled(order.user.email, {
      customerName: order.user.firstName,
      artistName: artist.stageName,
      type: typeLabel,
      orderNumber: order.orderNumber,
      orderId: order.id,
      attachmentUrl: data?.attachmentUrl,
      notes: data?.notes,
    }).catch(() => {});

    return customization;
  }

  async startCustomization(artistId: string, userId: string, customizationId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('No tienes permiso');

    return this.prisma.orderItemCustomization.update({
      where: { id: customizationId },
      data: { status: CustomizationStatus.IN_PROGRESS },
    });
  }

  async getPendingCustomizations(artistId: string, userId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('No tienes permiso');

    return this.prisma.orderItemCustomization.findMany({
      where: {
        fulfilled: false,
        orderItem: {
          artistProduct: { artistId },
          order: { status: { in: ['PAID', 'PROCESSING'] } },
        },
      },
      include: {
        orderItem: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                createdAt: true,
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            },
            artistProduct: { include: { product: { select: { name: true, images: true } } } },
          },
        },
      },
      orderBy: { orderItem: { order: { createdAt: 'asc' } } },
    });
  }

  async getCustomizationHistory(artistId: string, userId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('No tienes permiso');

    return this.prisma.orderItemCustomization.findMany({
      where: {
        fulfilled: true,
        orderItem: {
          artistProduct: { artistId },
        },
      },
      include: {
        orderItem: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                createdAt: true,
                user: { select: { id: true, firstName: true, lastName: true } },
              },
            },
            artistProduct: { include: { product: { select: { name: true } } } },
          },
        },
      },
      orderBy: { fulfilledAt: 'desc' },
      take: 50,
    });
  }

  // ─── VIDEO CALL CONFIG ────────────────────────────────────

  async updateVideoCallConfig(
    artistId: string,
    userId: string,
    data: { meetingLink?: string; callDuration?: number; maxPerWeek?: number; availabilitySlots?: any },
  ) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('No tienes permiso');

    return this.prisma.artistCustomization.update({
      where: { artistId_type: { artistId, type: CustomizationType.VIDEO_CALL } },
      data: {
        meetingLink: data.meetingLink,
        callDuration: data.callDuration,
        maxPerWeek: data.maxPerWeek,
        availabilitySlots: data.availabilitySlots,
      },
    });
  }

  async getAvailableSlots(artistId: string) {
    const config = await this.prisma.artistCustomization.findUnique({
      where: { artistId_type: { artistId, type: CustomizationType.VIDEO_CALL } },
    });

    if (!config || !config.isActive) {
      return [];
    }

    const slots = (config.availabilitySlots as any[]) || [];
    if (slots.length === 0) return [];

    const duration = config.callDuration || 30;
    const maxPerWeek = config.maxPerWeek || 5;

    // Count booked slots this week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const bookedCount = await this.prisma.videoCallSlot.count({
      where: {
        artistCustomizationId: config.id,
        isBooked: true,
        date: { gte: weekStart },
      },
    });

    if (bookedCount >= maxPerWeek) return [];

    // Generate available slots for the next 14 days
    const available: { date: string; duration: number }[] = [];
    for (let d = 1; d <= 14; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() + d);
      const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, etc.

      for (const slot of slots) {
        if (Number(slot.dayOfWeek) !== dayOfWeek) continue;

        const [startH, startM] = slot.startTime.split(':').map(Number);
        const [endH, endM] = slot.endTime.split(':').map(Number);

        let currentH = startH;
        let currentM = startM;

        while (currentH * 60 + currentM + duration <= endH * 60 + endM) {
          const slotDate = new Date(date);
          slotDate.setHours(currentH, currentM, 0, 0);

          // Check if already booked
          const alreadyBooked = await this.prisma.videoCallSlot.findFirst({
            where: {
              artistCustomizationId: config.id,
              date: slotDate,
              isBooked: true,
            },
          });

          if (!alreadyBooked) {
            available.push({
              date: slotDate.toISOString(),
              duration,
            });
          }

          currentM += duration;
          if (currentM >= 60) {
            currentH += Math.floor(currentM / 60);
            currentM = currentM % 60;
          }
        }
      }
    }

    return available;
  }

  async bookVideoCallSlot(
    artistId: string,
    userId: string,
    orderCustomizationId: string,
    slotDate: string,
  ) {
    const config = await this.prisma.artistCustomization.findUnique({
      where: { artistId_type: { artistId, type: CustomizationType.VIDEO_CALL } },
    });
    if (!config || !config.isActive) {
      throw new BadRequestException('Videollamadas no disponibles');
    }

    // Verify the order customization belongs to this user
    const orderCust = await this.prisma.orderItemCustomization.findUnique({
      where: { id: orderCustomizationId },
      include: { orderItem: { include: { order: true } } },
    });
    if (!orderCust || orderCust.orderItem.order.userId !== userId) {
      throw new ForbiddenException('No tienes permiso');
    }
    if (orderCust.type !== CustomizationType.VIDEO_CALL) {
      throw new BadRequestException('Esta personalizacion no es de videollamada');
    }

    const date = new Date(slotDate);
    const duration = config.callDuration || 30;
    const meetingLink = config.meetingLink || '';

    // Check if slot is free
    const existing = await this.prisma.videoCallSlot.findFirst({
      where: {
        artistCustomizationId: config.id,
        date,
        isBooked: true,
      },
    });
    if (existing) {
      throw new BadRequestException('Este horario ya esta reservado');
    }

    // Create the slot booking
    const slot = await this.prisma.videoCallSlot.create({
      data: {
        artistCustomizationId: config.id,
        orderCustomizationId,
        date,
        duration,
        isBooked: true,
      },
    });

    // Update the order customization
    await this.prisma.orderItemCustomization.update({
      where: { id: orderCustomizationId },
      data: {
        scheduledDate: date,
        meetingLink,
      },
    });

    // Get artist info for notifications
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      include: { user: { select: { id: true, email: true, firstName: true } } },
    });

    // Notify both parties (in background — don't block response)
    const customer = orderCust.orderItem.order;
    this.prisma.user.findUnique({
      where: { id: customer.userId },
      select: { id: true, email: true, firstName: true },
    }).then((customerUser) => {
      if (customerUser) {
        this.notificationsService.create({
          userId: customerUser.id,
          type: NotificationType.VIDEO_CALL_SCHEDULED,
          title: 'Videollamada programada',
          message: `Tu videollamada con ${artist!.stageName} fue programada para el ${date.toLocaleDateString('es-PE')}.`,
          data: { orderId: customer.id, date: date.toISOString() },
        }).catch(() => {});

        this.emailService.sendVideoCallScheduled(customerUser.email, {
          customerName: customerUser.firstName,
          artistName: artist!.stageName,
          date: date.toISOString(),
          duration,
          meetingLink,
        }).catch(() => {});
      }

      // Notify artist
      if (artist) {
        this.notificationsService.create({
          userId: artist.userId,
          type: NotificationType.VIDEO_CALL_SCHEDULED,
          title: 'Nueva videollamada agendada',
          message: `${customerUser?.firstName} agendo una videollamada para el ${date.toLocaleDateString('es-PE')}.`,
          data: { date: date.toISOString() },
        }).catch(() => {});
      }
    }).catch(() => {});

    return slot;
  }

  private getCustomizationLabel(type: CustomizationType): string {
    const labels: Record<string, string> = {
      AUTOGRAPH: 'autografo',
      HANDWRITTEN_LETTER: 'carta manuscrita',
      VIDEO_GREETING: 'video saludo',
      VIDEO_CALL: 'videollamada',
      PRODUCT_PERSONALIZATION: 'personalizacion de producto',
    };
    return labels[type] || type;
  }

  // ─── LANDING CONFIG ────────────────────────────────────

  async getLandingConfig(artistId: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: { landingConfig: true },
    });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    return artist.landingConfig || {};
  }

  async updateLandingConfig(artistId: string, userId: string, config: Record<string, any>) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('No tienes permiso');

    return this.prisma.artist.update({
      where: { id: artistId },
      data: { landingConfig: config },
      select: { landingConfig: true },
    });
  }

  // ─── GALLERY ────────────────────────────────────

  async getGallery(artistId: string) {
    return this.prisma.mediaItem.findMany({
      where: { artistId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async deleteMediaItem(artistId: string, userId: string, mediaItemId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('No tienes permiso');

    return this.prisma.mediaItem.delete({ where: { id: mediaItemId } });
  }

  async reorderGallery(artistId: string, userId: string, items: { id: string; sortOrder: number }[]) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('No tienes permiso');

    await Promise.all(
      items.map((item) =>
        this.prisma.mediaItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return { success: true };
  }

  async approve(id: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id } });
    if (!artist) throw new NotFoundException('Artista no encontrado');

    return this.prisma.artist.update({
      where: { id },
      data: { isApproved: true, isActive: true },
    });
  }

  async reject(id: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!artist) throw new NotFoundException('Artista no encontrado');

    // Delete artist record and change user role back to USER
    await this.prisma.$transaction([
      this.prisma.artist.delete({ where: { id } }),
      this.prisma.user.update({
        where: { id: artist.userId },
        data: { role: Role.USER },
      }),
    ]);

    return { message: 'Artista rechazado exitosamente' };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
