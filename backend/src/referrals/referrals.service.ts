import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  async generateCode(userId: string) {
    // Check if user already has a referral code
    const existing = await this.prisma.referral.findUnique({
      where: { ownerId: userId },
    });

    if (existing) {
      return existing;
    }

    // Generate unique code
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const baseCode = user.firstName.toUpperCase().slice(0, 4) +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    const referral = await this.prisma.referral.create({
      data: {
        code: baseCode,
        ownerId: userId,
      },
    });

    return referral;
  }

  async getMyReferral(userId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { ownerId: userId },
      include: {
        referredUsers: {
          select: { id: true, firstName: true, lastName: true, createdAt: true },
        },
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            order: { select: { orderNumber: true, total: true, createdAt: true } },
          },
        },
      },
    });

    if (!referral) return null;

    const totalEarnings = await this.prisma.commission.aggregate({
      where: { referralId: referral.id },
      _sum: { amount: true },
    });

    const pendingEarnings = await this.prisma.commission.aggregate({
      where: { referralId: referral.id, status: 'PENDING' },
      _sum: { amount: true },
    });

    return {
      ...referral,
      totalEarnings: Number(totalEarnings._sum.amount || 0),
      pendingEarnings: Number(pendingEarnings._sum.amount || 0),
    };
  }

  async trackClick(code: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { code },
    });

    if (!referral) throw new NotFoundException('Codigo de referido no encontrado');

    await this.prisma.referral.update({
      where: { id: referral.id },
      data: { totalClicks: { increment: 1 } },
    });

    return { valid: true, code: referral.code };
  }

  async validateCode(code: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { code },
      select: { code: true, owner: { select: { firstName: true } } },
    });

    if (!referral) return { valid: false };

    return { valid: true, code: referral.code, ownerName: referral.owner.firstName };
  }

  // Admin endpoints
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [referrals, total] = await Promise.all([
      this.prisma.referral.findMany({
        skip,
        take: limit,
        include: {
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { referredUsers: true, orders: true, commissions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.referral.count(),
    ]);

    return { data: referrals, total, page, limit };
  }

  async getCommissions(
    page = 1,
    limit = 20,
    filters: {
      type?: string;
      status?: string;
      search?: string;
      from?: string;
      to?: string;
      artistId?: string;
      referralId?: string;
    } = {},
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.artistId) where.artistId = filters.artistId;
    if (filters.referralId) where.referralId = filters.referralId;

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { artist: { stageName: { contains: q, mode: 'insensitive' } } },
        { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
        { referral: { owner: { firstName: { contains: q, mode: 'insensitive' } } } },
        { referral: { owner: { lastName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [commissions, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        skip,
        take: limit,
        include: {
          order: {
            select: { orderNumber: true, total: true, createdAt: true, user: { select: { email: true } } },
          },
          ticket: {
            select: { id: true, price: true, show: { select: { name: true } } },
          },
          referral: {
            select: { code: true, owner: { select: { firstName: true, lastName: true } } },
          },
          artist: {
            select: { id: true, stageName: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commission.count({ where }),
    ]);

    return { data: commissions, total, page, limit };
  }

  async getCommissionsSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pending, paidThisMonth, generatedThisMonth, totalPaidAllTime] = await Promise.all([
      this.prisma.commission.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: { status: 'PAID', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.commission.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    return {
      pendingAmount: Number(pending._sum.amount || 0),
      pendingCount: pending._count,
      paidThisMonthAmount: Number(paidThisMonth._sum.amount || 0),
      paidThisMonthCount: paidThisMonth._count,
      generatedThisMonthAmount: Number(generatedThisMonth._sum.amount || 0),
      generatedThisMonthCount: generatedThisMonth._count,
      totalPaidAllTime: Number(totalPaidAllTime._sum.amount || 0),
    };
  }

  async markCommissionPaid(commissionId: string) {
    return this.prisma.commission.update({
      where: { id: commissionId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  async markAllPaid(artistId?: string, referralId?: string) {
    const where: any = { status: 'PENDING' };
    if (artistId) where.artistId = artistId;
    if (referralId) where.referralId = referralId;

    const result = await this.prisma.commission.updateMany({
      where,
      data: { status: 'PAID', paidAt: new Date() },
    });
    return { paid: result.count };
  }

  /** Artists that have at least one pending commission */
  async getArtistsWithPending() {
    const artists = await this.prisma.commission.groupBy({
      by: ['artistId'],
      where: { status: 'PENDING', artistId: { not: null } },
      _sum: { amount: true },
      _count: true,
    });

    const details = await Promise.all(
      artists.map(async (a) => {
        const artist = await this.prisma.artist.findUnique({
          where: { id: a.artistId! },
          select: { id: true, stageName: true, slug: true, profileImage: true },
        });

        // Get breakdown by type
        const breakdown = await this.prisma.commission.groupBy({
          by: ['type'],
          where: { status: 'PENDING', artistId: a.artistId! },
          _sum: { amount: true },
          _count: true,
        });

        return {
          artistId: a.artistId!,
          stageName: artist?.stageName || 'Artista',
          slug: artist?.slug || '',
          profileImage: artist?.profileImage || null,
          pendingAmount: Number(a._sum.amount || 0),
          pendingCount: a._count,
          breakdown: breakdown.map((b) => ({
            type: b.type,
            amount: Number(b._sum.amount || 0),
            count: b._count,
          })),
        };
      }),
    );

    return details.sort((a, b) => b.pendingAmount - a.pendingAmount);
  }

  /** Beneficiaries (artists + referrers) with pending commissions */
  async getBeneficiariesWithPending() {
    const artists = await this.getArtistsWithPending();

    // Get referrers with pending commissions
    const referrerGroups = await this.prisma.commission.groupBy({
      by: ['referralId'],
      where: { status: 'PENDING', referralId: { not: null } },
      _sum: { amount: true },
      _count: true,
    });

    const referrers = await Promise.all(
      referrerGroups.map(async (r) => {
        const referral = await this.prisma.referral.findUnique({
          where: { id: r.referralId! },
          select: {
            id: true,
            code: true,
            owner: { select: { firstName: true, lastName: true } },
          },
        });

        const breakdown = await this.prisma.commission.groupBy({
          by: ['type'],
          where: { status: 'PENDING', referralId: r.referralId! },
          _sum: { amount: true },
          _count: true,
        });

        return {
          referralId: r.referralId!,
          code: referral?.code || '',
          ownerName: referral
            ? `${referral.owner.firstName} ${referral.owner.lastName}`
            : 'Referido',
          pendingAmount: Number(r._sum.amount || 0),
          pendingCount: r._count,
          breakdown: breakdown.map((b) => ({
            type: b.type,
            amount: Number(b._sum.amount || 0),
            count: b._count,
          })),
        };
      }),
    );

    return {
      artists: artists,
      referrers: referrers.sort((a, b) => b.pendingAmount - a.pendingAmount),
    };
  }
}
