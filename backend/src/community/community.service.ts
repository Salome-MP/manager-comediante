import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  // ─── PUBLIC INFO ──────────────────────────────────────

  async getArtistInfo(artistId: string) {
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: {
        id: true,
        stageName: true,
        slug: true,
        profileImage: true,
        tagline: true,
        _count: { select: { communityMembers: true, communityMessages: true } },
      },
    });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    return artist;
  }

  // ─── MEMBERSHIP ──────────────────────────────────────

  async joinCommunity(userId: string, artistId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');

    const existing = await this.prisma.communityMember.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });
    if (existing) return { joined: true, alreadyMember: true };

    await this.prisma.communityMember.create({ data: { userId, artistId } });
    return { joined: true, alreadyMember: false };
  }

  async leaveCommunity(userId: string, artistId: string) {
    const existing = await this.prisma.communityMember.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });
    if (!existing) return { left: true };

    await this.prisma.communityMember.delete({ where: { id: existing.id } });
    return { left: true };
  }

  async getMembers(artistId: string) {
    const members = await this.prisma.communityMember.findMany({
      where: { artistId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return members.map((m) => ({
      id: m.user.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      joinedAt: m.createdAt,
    }));
  }

  async isMember(userId: string, artistId: string) {
    const existing = await this.prisma.communityMember.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });
    return { isMember: !!existing };
  }

  async getMyCommunities(userId: string) {
    const memberships = await this.prisma.communityMember.findMany({
      where: { userId },
      include: {
        artist: {
          select: {
            id: true,
            stageName: true,
            slug: true,
            profileImage: true,
            tagline: true,
            _count: { select: { communityMembers: true, communityMessages: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return memberships.map((m) => m.artist);
  }

  // ─── ANNOUNCEMENTS ──────────────────────────────────────

  async getAnnouncements(artistId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.communityMessage.findMany({
        where: { artistId, type: 'ANNOUNCEMENT' },
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.communityMessage.count({ where: { artistId, type: 'ANNOUNCEMENT' } }),
    ]);
    return { data, total, page, limit };
  }

  async createAnnouncement(artistId: string, userId: string, content: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('Solo el artista puede crear avisos');

    return this.prisma.communityMessage.create({
      data: { artistId, senderId: userId, type: 'ANNOUNCEMENT', content },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  // ─── CHAT ──────────────────────────────────────

  async getChatMessages(artistId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.communityMessage.findMany({
        where: { artistId, type: 'CHAT' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.communityMessage.count({ where: { artistId, type: 'CHAT' } }),
    ]);
    return { data: data.reverse(), total, page, limit };
  }

  async createChatMessage(artistId: string, userId: string, content: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');

    return this.prisma.communityMessage.create({
      data: { artistId, senderId: userId, type: 'CHAT', content },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  // ─── MODERATION ──────────────────────────────────────

  async deleteMessage(artistId: string, userId: string, messageId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('Solo el artista puede eliminar mensajes');

    const message = await this.prisma.communityMessage.findUnique({ where: { id: messageId } });
    if (!message || message.artistId !== artistId) throw new NotFoundException('Mensaje no encontrado');

    await this.prisma.communityMessage.delete({ where: { id: messageId } });
    return { success: true };
  }

  async togglePin(artistId: string, userId: string, messageId: string) {
    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artista no encontrado');
    if (artist.userId !== userId) throw new ForbiddenException('Solo el artista puede fijar avisos');

    const message = await this.prisma.communityMessage.findUnique({ where: { id: messageId } });
    if (!message || message.artistId !== artistId) throw new NotFoundException('Mensaje no encontrado');

    return this.prisma.communityMessage.update({
      where: { id: messageId },
      data: { isPinned: !message.isPinned },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
    });
  }
}
