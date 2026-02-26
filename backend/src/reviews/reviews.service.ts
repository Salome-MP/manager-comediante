import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async findByProduct(artistProductId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where: { artistProductId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.review.count({ where: { artistProductId } }),
      this.prisma.review.aggregate({
        where: { artistProductId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      data: reviews,
      total,
      page,
      limit,
      averageRating: aggregate._avg.rating || 0,
      totalReviews: aggregate._count.rating,
    };
  }

  async create(userId: string, artistProductId: string, rating: number, comment?: string) {
    // Verify product exists
    const product = await this.prisma.artistProduct.findUnique({ where: { id: artistProductId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    // Check for duplicate
    const existing = await this.prisma.review.findUnique({
      where: { userId_artistProductId: { userId, artistProductId } },
    });
    if (existing) throw new ConflictException('Ya dejaste una reseña para este producto');

    return this.prisma.review.create({
      data: { userId, artistProductId, rating: Math.min(5, Math.max(1, rating)), comment },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  async update(userId: string, reviewId: string, rating: number, comment?: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    if (review.userId !== userId) throw new ForbiddenException('No tienes permiso');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { rating: Math.min(5, Math.max(1, rating)), comment },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  async delete(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    if (review.userId !== userId) throw new ForbiddenException('No tienes permiso');

    return this.prisma.review.delete({ where: { id: reviewId } });
  }
}
