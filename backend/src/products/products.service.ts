import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AssignProductDto } from './dto/assign-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const slug = this.generateSlug(dto.name);

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        categoryId: dto.categoryId,
        manufacturingCost: dto.manufacturingCost,
        suggestedPrice: dto.suggestedPrice,
        images: dto.images || [],
        variants: (dto.variants || []) as any,
      },
      include: { category: true },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count(),
    ]);

    return { data: products, total, page, limit };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const data: any = { ...dto };
    if (dto.name && dto.name !== product.name) {
      data.slug = this.generateSlug(dto.name);
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async delete(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    await this.prisma.artistProduct.deleteMany({ where: { productId: id } });
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Producto eliminado correctamente' };
  }

  async assignToArtist(dto: AssignProductDto) {
    return this.prisma.artistProduct.upsert({
      where: {
        artistId_productId: {
          artistId: dto.artistId,
          productId: dto.productId,
        },
      },
      update: {
        salePrice: dto.salePrice,
        artistCommission: dto.artistCommission ?? 50,
        stock: dto.stock,
        customImages: dto.customImages || [],
        isActive: true,
      },
      create: {
        artistId: dto.artistId,
        productId: dto.productId,
        salePrice: dto.salePrice,
        artistCommission: dto.artistCommission ?? 50,
        stock: dto.stock,
        customImages: dto.customImages || [],
      },
    });
  }

  /**
   * Given a categoryId, returns an array with that ID plus all its children IDs.
   * If the category is a leaf (no children), returns just [categoryId].
   */
  private async resolveCategoryIds(categoryId: string): Promise<string[]> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { children: { select: { id: true } } },
    });
    if (!category) return [categoryId];
    if (category.children.length > 0) {
      return [categoryId, ...category.children.map((c) => c.id)];
    }
    return [categoryId];
  }

  async findAllAssignments(
    page = 1,
    limit = 20,
    artistId?: string,
    categoryId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.ArtistProductWhereInput = {};
    if (artistId) where.artistId = artistId;
    if (categoryId) {
      const categoryIds = await this.resolveCategoryIds(categoryId);
      where.product = { categoryId: { in: categoryIds } };
    }

    const [data, total] = await Promise.all([
      this.prisma.artistProduct.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: { include: { category: true } },
          artist: { select: { id: true, stageName: true, slug: true, profileImage: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.artistProduct.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByArtist(
    artistId: string,
    page = 1,
    limit = 20,
    categoryId?: string,
  ) {
    const skip = (page - 1) * limit;

    const now = new Date();
    const where: Prisma.ArtistProductWhereInput = {
      artistId,
      isActive: true,
      product: { isActive: true },
      OR: [{ publishAt: null }, { publishAt: { lte: now } }],
    };

    if (categoryId) {
      const categoryIds = await this.resolveCategoryIds(categoryId);
      where.product = { ...where.product as object, categoryId: { in: categoryIds } };
    }

    const [artistProducts, total] = await Promise.all([
      this.prisma.artistProduct.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: { include: { category: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.artistProduct.count({ where }),
    ]);

    const statsMap = await this.getReviewStatsMap(artistProducts.map((p) => p.id));
    return { data: this.enrichWithReviewStats(artistProducts, statsMap), total, page, limit };
  }

  async findArtistProductDetail(id: string) {
    const artistProduct = await this.prisma.artistProduct.findUnique({
      where: { id },
      include: {
        product: { include: { category: true } },
        artist: {
          select: {
            id: true,
            stageName: true,
            slug: true,
            profileImage: true,
          },
        },
      },
    });

    if (!artistProduct) {
      throw new NotFoundException('Producto de artista no encontrado');
    }
    return artistProduct;
  }

  async updateArtistProduct(
    id: string,
    data: {
      salePrice?: number;
      stock?: number;
      isActive?: boolean;
      isFeatured?: boolean;
      publishAt?: string | null;
      customImages?: string[];
    },
  ) {
    const artistProduct = await this.prisma.artistProduct.findUnique({
      where: { id },
    });
    if (!artistProduct) {
      throw new NotFoundException('Producto de artista no encontrado');
    }

    return this.prisma.artistProduct.update({
      where: { id },
      data,
      include: {
        product: { include: { category: true } },
      },
    });
  }

  async findFeatured(limit = 8) {
    const now = new Date();
    const products = await this.prisma.artistProduct.findMany({
      where: { isActive: true, artist: { isActive: true }, OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      include: {
        product: { include: { category: { select: { name: true } } } },
        artist: { select: { stageName: true, slug: true } },
      },
    });

    // Deduplicate by productId — keep the first (featured/newest) per base product
    const seen = new Set<string>();
    const unique = products.filter((p) => {
      if (seen.has(p.productId)) return false;
      seen.add(p.productId);
      return true;
    });

    const limited = unique.slice(0, limit);
    const statsMap = await this.getReviewStatsMap(limited.map((p) => p.id));
    return { data: this.enrichWithReviewStats(limited, statsMap) };
  }

  async search(filters: {
    q?: string;
    categoryId?: string;
    artistId?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const now = new Date();
    const where: Prisma.ArtistProductWhereInput = {
      isActive: true,
      artist: { isActive: true },
      OR: [{ publishAt: null }, { publishAt: { lte: now } }],
    };

    if (filters.q) {
      where.product = {
        isActive: true,
        OR: [
          { name: { contains: filters.q, mode: 'insensitive' } },
          { description: { contains: filters.q, mode: 'insensitive' } },
        ],
      };
    } else {
      where.product = { isActive: true };
    }

    if (filters.categoryId) {
      const categoryIds = await this.resolveCategoryIds(filters.categoryId);
      where.product = { ...where.product as object, categoryId: { in: categoryIds } };
    }

    if (filters.artistId) {
      where.artistId = filters.artistId;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.salePrice = {};
      if (filters.minPrice !== undefined) where.salePrice.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.salePrice.lte = filters.maxPrice;
    }

    const [data, total] = await Promise.all([
      this.prisma.artistProduct.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: { include: { category: true } },
          artist: { select: { id: true, stageName: true, slug: true, profileImage: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.artistProduct.count({ where }),
    ]);

    const statsMap = await this.getReviewStatsMap(data.map((p) => p.id));
    return { data: this.enrichWithReviewStats(data, statsMap), total, page, limit };
  }

  async getScheduledByArtist(artistId: string) {
    const now = new Date();
    const products = await this.prisma.artistProduct.findMany({
      where: {
        artistId,
        publishAt: { gt: now },
      },
      include: {
        product: { include: { category: true } },
      },
      orderBy: { publishAt: 'asc' },
    });
    return products;
  }

  async setPublishDate(id: string, publishAt: string | null) {
    const ap = await this.prisma.artistProduct.findUnique({ where: { id } });
    if (!ap) throw new NotFoundException('Producto de artista no encontrado');
    return this.prisma.artistProduct.update({
      where: { id },
      data: { publishAt: publishAt ? new Date(publishAt) : null },
      include: { product: { include: { category: true } } },
    });
  }

  /**
   * Batch-fetch review stats for a list of artist product IDs.
   * Returns a map: { [artistProductId]: { averageRating, totalReviews } }
   */
  private async getReviewStatsMap(artistProductIds: string[]): Promise<Record<string, { averageRating: number; totalReviews: number }>> {
    if (artistProductIds.length === 0) return {};

    const groups = await this.prisma.review.groupBy({
      by: ['artistProductId'],
      where: { artistProductId: { in: artistProductIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const map: Record<string, { averageRating: number; totalReviews: number }> = {};
    for (const g of groups) {
      map[g.artistProductId] = {
        averageRating: g._avg.rating || 0,
        totalReviews: g._count.rating,
      };
    }
    return map;
  }

  private enrichWithReviewStats<T extends { id: string }>(
    items: T[],
    statsMap: Record<string, { averageRating: number; totalReviews: number }>,
  ): (T & { reviewStats: { averageRating: number; totalReviews: number } })[] {
    return items.map((item) => ({
      ...item,
      reviewStats: statsMap[item.id] || { averageRating: 0, totalReviews: 0 },
    }));
  }

  async findRelated(artistProductId: string, limit = 8) {
    const current = await this.prisma.artistProduct.findUnique({
      where: { id: artistProductId },
      include: { product: { select: { categoryId: true } } },
    });
    if (!current) throw new NotFoundException('Producto de artista no encontrado');

    const now = new Date();
    const baseWhere: Prisma.ArtistProductWhereInput = {
      id: { not: artistProductId },
      isActive: true,
      artist: { isActive: true },
      product: { isActive: true },
      OR: [{ publishAt: null }, { publishAt: { lte: now } }],
    };

    // Prioritize same artist, then same category
    const [sameArtist, sameCategory] = await Promise.all([
      this.prisma.artistProduct.findMany({
        where: { ...baseWhere, artistId: current.artistId },
        take: limit,
        include: {
          product: { include: { category: { select: { name: true } } } },
          artist: { select: { stageName: true, slug: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.artistProduct.findMany({
        where: {
          ...baseWhere,
          artistId: { not: current.artistId },
          product: { isActive: true, categoryId: current.product.categoryId },
        },
        take: limit,
        include: {
          product: { include: { category: { select: { name: true } } } },
          artist: { select: { stageName: true, slug: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    const seen = new Set<string>();
    const combined: typeof sameArtist = [];
    for (const p of [...sameArtist, ...sameCategory]) {
      if (!seen.has(p.id) && combined.length < limit) {
        seen.add(p.id);
        combined.push(p);
      }
    }

    const statsMap = await this.getReviewStatsMap(combined.map((p) => p.id));
    return this.enrichWithReviewStats(combined, statsMap);
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
