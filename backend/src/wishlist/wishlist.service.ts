import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        artistProduct: {
          include: {
            product: { include: { category: true } },
            artist: { select: { id: true, stageName: true, slug: true, profileImage: true } },
          },
        },
      },
    });
  }

  async toggle(userId: string, artistProductId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_artistProductId: { userId, artistProductId } },
    });

    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { wishlisted: false };
    }

    await this.prisma.wishlist.create({ data: { userId, artistProductId } });
    return { wishlisted: true };
  }

  async check(userId: string, artistProductId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_artistProductId: { userId, artistProductId } },
    });
    return { wishlisted: !!existing };
  }

  async getIds(userId: string) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      select: { artistProductId: true },
    });
    return items.map((i) => i.artistProductId);
  }
}
