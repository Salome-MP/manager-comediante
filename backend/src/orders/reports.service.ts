import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

const PAID_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getAdminDashboardStats() {
    const [
      totalArtists,
      totalProducts,
      totalOrders,
      totalUsers,
      totalShows,
      totalTicketsSold,
      recentOrders,
      totalRevenue,
      paidRevenue,
      ticketRevenue,
    ] = await Promise.all([
      this.prisma.artist.count(),
      this.prisma.artistProduct.count({ where: { isActive: true } }),
      this.prisma.order.count(),
      this.prisma.user.count({ where: { role: 'USER' } }),
      this.prisma.show.count(),
      this.prisma.ticket.count({ where: { paymentId: { not: null }, status: { not: 'CANCELLED' } } }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.order.aggregate({ _sum: { total: true } }),
      this.prisma.order.aggregate({ where: { status: { in: PAID_STATUSES } }, _sum: { total: true } }),
      this.prisma.ticket.aggregate({ where: { paymentId: { not: null }, status: { not: 'CANCELLED' } }, _sum: { price: true } }),
    ]);

    return {
      totalArtists,
      totalProducts,
      totalOrders,
      totalUsers,
      totalShows,
      totalTicketsSold,
      ticketRevenue: Number(ticketRevenue._sum.price || 0),
      totalRevenue: Number(totalRevenue._sum.total || 0),
      paidRevenue: Number(paidRevenue._sum.total || 0) + Number(ticketRevenue._sum.price || 0),
      recentOrders,
    };
  }

  // ── Reports Summary (KPIs) ──────────────────────────────────────────────────

  async getReportsSummary(period: 'week' | 'month' | 'year') {
    const now = new Date();
    let startDate: Date;

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // 1) Total sales from paid orders in period
    const orderRevenue = await this.prisma.order.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: { in: PAID_STATUSES },
      },
      _sum: { total: true },
    });

    // 2) Total ticket sales in period
    const ticketRevenue = await this.prisma.ticket.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
      _sum: { price: true },
    });

    const totalSales = Number(orderRevenue._sum?.total || 0) + Number(ticketRevenue._sum?.price || 0);

    // 3) Manufacturing cost for items sold in period
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: startDate },
          status: { in: PAID_STATUSES },
        },
      },
      include: {
        artistProduct: {
          include: { product: { select: { manufacturingCost: true } } },
        },
      },
    });

    let totalManufacturingCost = 0;
    for (const item of orderItems) {
      totalManufacturingCost += item.quantity * Number(item.artistProduct.product.manufacturingCost);
    }

    // 4) Total commissions only from orders/tickets that count as sales in this period
    const orderCommissions = await this.prisma.commission.aggregate({
      where: {
        order: {
          createdAt: { gte: startDate },
          status: { in: PAID_STATUSES },
        },
      },
      _sum: { amount: true },
    });

    const ticketCommissions = await this.prisma.commission.aggregate({
      where: {
        ticket: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' },
        },
      },
      _sum: { amount: true },
    });

    const totalCommissionsAmount = Number(orderCommissions._sum?.amount || 0) + Number(ticketCommissions._sum?.amount || 0);
    const platformProfit = totalSales - totalManufacturingCost - totalCommissionsAmount;

    // 5) Pending commissions (all time, what the platform owes)
    const pendingCommissions = await this.prisma.commission.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
    });

    // 6) Orders count in period
    const ordersInPeriod = await this.prisma.order.count({
      where: {
        createdAt: { gte: startDate },
        status: { in: PAID_STATUSES },
      },
    });

    return {
      totalSales: Math.round(totalSales * 100) / 100,
      platformProfit: Math.round(platformProfit * 100) / 100,
      pendingCommissions: Number(pendingCommissions._sum?.amount || 0),
      ordersInPeriod,
    };
  }

  // ── Sales Chart (products + tickets) ────────────────────────────────────────

  async getSalesChart(period: 'week' | 'month' | 'year', artistId?: string) {
    const now = new Date();
    let startDate: Date;
    let groupFormat: string;

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupFormat = 'day';
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      groupFormat = 'day';
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      groupFormat = 'month';
    }

    const orderWhere: any = {
      createdAt: { gte: startDate },
      status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
    };

    if (artistId) {
      orderWhere.items = { some: { artistProduct: { artistId } } };
    }

    const orders = await this.prisma.order.findMany({
      where: orderWhere,
      select: { createdAt: true, total: true, subtotal: true },
      orderBy: { createdAt: 'asc' },
    });

    // Also fetch tickets
    const ticketWhere: any = {
      createdAt: { gte: startDate },
      status: { not: 'CANCELLED' },
    };
    if (artistId) {
      ticketWhere.show = { artistId };
    }

    const tickets = await this.prisma.ticket.findMany({
      where: ticketWhere,
      select: { createdAt: true, price: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped = new Map<string, { products: number; tickets: number; orders: number }>();

    const toKey = (d: Date) => {
      if (groupFormat === 'day') {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    for (const order of orders) {
      const key = toKey(new Date(order.createdAt));
      if (!grouped.has(key)) {
        grouped.set(key, { products: 0, tickets: 0, orders: 0 });
      }
      const entry = grouped.get(key)!;
      entry.products += Number(order.total);
      entry.orders += 1;
    }

    for (const ticket of tickets) {
      const key = toKey(new Date(ticket.createdAt));
      if (!grouped.has(key)) {
        grouped.set(key, { products: 0, tickets: 0, orders: 0 });
      }
      const entry = grouped.get(key)!;
      entry.tickets += Number(ticket.price);
    }

    const chart = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        sales: Math.round((data.products + data.tickets) * 100) / 100,
        products: Math.round(data.products * 100) / 100,
        tickets: Math.round(data.tickets * 100) / 100,
        orders: data.orders,
      }));

    return chart;
  }

  // ── Top Products ────────────────────────────────────────────────────────────

  async getTopProducts(limit = 8) {
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['artistProductId'],
      where: {
        order: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const results = await Promise.all(
      topItems.map(async (item) => {
        const ap = await this.prisma.artistProduct.findUnique({
          where: { id: item.artistProductId },
          include: {
            product: { select: { name: true, images: true } },
            artist: { select: { stageName: true } },
          },
        });
        return {
          artistProductId: item.artistProductId,
          productName: ap?.product.name || 'Producto',
          artistName: ap?.artist.stageName || 'Artista',
          image: ap?.product.images?.[0] || null,
          totalQuantity: item._sum.quantity || 0,
          totalRevenue: Number(item._sum.totalPrice || 0),
        };
      }),
    );

    return results;
  }

  // ── Shows Summary ───────────────────────────────────────────────────────────

  async getShowsSummary() {
    // Upcoming shows with ticket counts
    const upcomingShows = await this.prisma.show.findMany({
      where: {
        status: 'SCHEDULED',
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
      take: 6,
      include: {
        artist: { select: { stageName: true } },
        _count: { select: { tickets: true } },
      },
    });

    const showsWithOccupancy = upcomingShows.map((show) => ({
      id: show.id,
      name: show.name,
      artistName: show.artist.stageName,
      venue: show.venue,
      date: show.date,
      capacity: show.totalCapacity,
      ticketsSold: show._count.tickets,
      occupancy: show.totalCapacity
        ? Math.round((show._count.tickets / show.totalCapacity) * 100)
        : 0,
      ticketPrice: Number(show.ticketPrice || 0),
    }));

    // Aggregated ticket stats
    const totalTicketsSold = await this.prisma.ticket.count({
      where: { status: { not: 'CANCELLED' } },
    });

    const ticketRevenue = await this.prisma.ticket.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { price: true },
    });

    // Average occupancy across shows that have capacity set
    const showsWithCapacity = await this.prisma.show.findMany({
      where: { totalCapacity: { not: null, gt: 0 } },
      include: { _count: { select: { tickets: true } } },
    });

    let avgOccupancy = 0;
    if (showsWithCapacity.length > 0) {
      const totalOccupancy = showsWithCapacity.reduce((acc, s) => {
        return acc + (s._count.tickets / (s.totalCapacity || 1)) * 100;
      }, 0);
      avgOccupancy = Math.round(totalOccupancy / showsWithCapacity.length);
    }

    return {
      upcomingShows: showsWithOccupancy,
      totalTicketsSold,
      ticketRevenue: Number(ticketRevenue._sum.price || 0),
      avgOccupancy,
    };
  }

  // ── Top Artists by Revenue (enhanced) ───────────────────────────────────────

  async getTopArtistsByRevenue(limit = 10) {
    const artists = await this.prisma.artist.findMany({
      where: { isActive: true },
      include: {
        user: { select: { email: true } },
        _count: { select: { artistProducts: true, shows: true, followers: true } },
      },
    });

    const result = [];
    for (const artist of artists) {
      // Artist commissions — only from orders actually paid
      const orderCommissions = await this.prisma.commission.aggregate({
        where: {
          artistId: artist.id,
          type: { in: ['artist', 'customization'] },
          order: { status: { in: PAID_STATUSES } },
        },
        _sum: { amount: true },
      });

      const ticketCommissions = await this.prisma.commission.aggregate({
        where: {
          artistId: artist.id,
          type: 'ticket',
          ticket: { status: { not: 'CANCELLED' } },
        },
        _sum: { amount: true },
      });

      // Total sales generated by this artist (orders)
      const orderSales = await this.prisma.orderItem.aggregate({
        where: {
          artistProduct: { artistId: artist.id },
          order: { status: { in: PAID_STATUSES } },
        },
        _sum: { totalPrice: true },
      });

      // Ticket sales
      const ticketSales = await this.prisma.ticket.aggregate({
        where: {
          show: { artistId: artist.id },
          status: { not: 'CANCELLED' },
        },
        _sum: { price: true },
      });

      const totalSales = Number(orderSales._sum?.totalPrice || 0) + Number(ticketSales._sum?.price || 0);
      const artistCommission = Number(orderCommissions._sum?.amount || 0) + Number(ticketCommissions._sum?.amount || 0);

      // Manufacturing cost for this artist's sold items
      const items = await this.prisma.orderItem.findMany({
        where: {
          artistProduct: { artistId: artist.id },
          order: { status: { in: PAID_STATUSES } },
        },
        include: {
          artistProduct: {
            include: { product: { select: { manufacturingCost: true } } },
          },
        },
      });

      let mfgCost = 0;
      for (const item of items) {
        mfgCost += item.quantity * Number(item.artistProduct.product.manufacturingCost);
      }

      const platformProfit = totalSales - mfgCost - artistCommission;

      result.push({
        ...artist,
        totalRevenue: artistCommission,
        totalSales: Math.round(totalSales * 100) / 100,
        platformProfit: Math.round(platformProfit * 100) / 100,
      });
    }

    return result.sort((a, b) => b.totalSales - a.totalSales).slice(0, limit);
  }

  // ── Artist-specific methods (unchanged) ─────────────────────────────────────

  async getArtistDashboardStats(artistId: string) {
    const [
      totalProductsSold,
      assignedProducts,
      totalShows,
      totalFollowers,
      totalTickets,
      pendingCustomizations,
    ] = await Promise.all([
      this.prisma.orderItem.aggregate({
        where: { artistProduct: { artistId }, order: { status: { in: PAID_STATUSES } } },
        _sum: { quantity: true },
      }).then(r => r._sum.quantity || 0),
      this.prisma.artistProduct.count({ where: { artistId, isActive: true } }),
      this.prisma.show.count({ where: { artistId } }),
      this.prisma.artistFollower.count({ where: { artistId } }),
      this.prisma.ticket.count({
        where: { show: { artistId }, paymentId: { not: null }, status: { not: 'CANCELLED' } },
      }),
      this.prisma.orderItemCustomization.count({
        where: {
          fulfilled: false,
          orderItem: {
            artistProduct: { artistId },
            order: { status: { in: ['PAID', 'PROCESSING'] } },
          },
        },
      }),
    ]);

    // Ganancias totales = comisiones YA PAGADAS al artista (productos + tickets)
    const earnings = await this.prisma.commission.aggregate({
      where: { artistId, type: { in: ['artist', 'customization', 'ticket'] }, status: 'PAID' },
      _sum: { amount: true },
    });

    // Pendiente cobro = comisiones que la plataforma aún debe al artista
    const pendingEarnings = await this.prisma.commission.aggregate({
      where: { artistId, type: { in: ['artist', 'customization', 'ticket'] }, status: 'PENDING' },
      _sum: { amount: true },
    });

    // Referral earnings (artist's user may own a referral link)
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: { userId: true },
    });

    let referralEarnings = 0;
    let referralPending = 0;
    let referralCount = 0;
    if (artist) {
      const referral = await this.prisma.referral.findUnique({
        where: { ownerId: artist.userId },
        select: { id: true },
      });
      if (referral) {
        const refEarned = await this.prisma.commission.aggregate({
          where: { referralId: referral.id, status: 'PAID' },
          _sum: { amount: true },
        });
        const refPending = await this.prisma.commission.aggregate({
          where: { referralId: referral.id, status: 'PENDING' },
          _sum: { amount: true },
          _count: true,
        });
        referralEarnings = Number(refEarned._sum.amount || 0);
        referralPending = Number(refPending._sum.amount || 0);
        referralCount = refPending._count || 0;
      }
    }

    // Recent orders for this artist
    const recentOrders = await this.prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        items: { some: { artistProduct: { artistId } } },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    // Upcoming shows
    const upcomingShows = await this.prisma.show.findMany({
      where: { artistId, status: 'SCHEDULED', date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 3,
      include: { _count: { select: { tickets: true } } },
    });

    return {
      totalProducts: totalProductsSold,
      assignedProducts,
      totalShows,
      totalFollowers,
      totalTickets,
      pendingCustomizations,
      totalEarnings: Number(earnings._sum.amount || 0),
      pendingEarnings: Number(pendingEarnings._sum.amount || 0),
      referralEarnings,
      referralPending,
      referralCount,
      recentOrders,
      upcomingShows,
    };
  }

  async getArtistSalesDetail(artistId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: {
          artistProduct: { artistId },
          order: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        },
        skip,
        take: limit,
        include: {
          order: {
            select: { orderNumber: true, createdAt: true, status: true, user: { select: { firstName: true, lastName: true } } },
          },
          artistProduct: { include: { product: true } },
          customizations: true,
        },
        orderBy: { order: { createdAt: 'desc' } },
      }),
      this.prisma.orderItem.count({
        where: {
          artistProduct: { artistId },
          order: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        },
      }),
    ]);

    return { data: items, total, page, limit };
  }

  async getArtistTicketSales(artistId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where = {
      show: { artistId },
      paymentId: { not: null as any },
      status: { not: 'CANCELLED' as any },
    };

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        include: {
          show: { select: { name: true, date: true, ticketPrice: true, platformFee: true } },
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { data: tickets, total, page, limit };
  }

  async getArtistAnalytics(artistId: string) {
    // Top selling products
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['artistProductId'],
      where: {
        artistProduct: { artistId },
        order: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5,
    });

    const topProductsWithNames = await Promise.all(
      topProducts.map(async (tp) => {
        const ap = await this.prisma.artistProduct.findUnique({
          where: { id: tp.artistProductId },
          include: { product: { select: { name: true, images: true } } },
        });
        return {
          productId: tp.artistProductId,
          name: ap?.product.name || 'Producto',
          image: ap?.product.images?.[0],
          totalQuantity: tp._sum.quantity || 0,
          totalRevenue: Number(tp._sum.totalPrice || 0),
        };
      }),
    );

    // Followers count by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const followers = await this.prisma.artistFollower.findMany({
      where: { artistId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const followersByMonth = new Map<string, number>();
    for (const f of followers) {
      const d = new Date(f.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      followersByMonth.set(key, (followersByMonth.get(key) || 0) + 1);
    }

    const followersChart = Array.from(followersByMonth.entries()).map(([month, count]) => ({
      month,
      newFollowers: count,
    }));

    // Conversion: unique visitors who bought (approximate with order count / follower count)
    const totalFollowers = await this.prisma.artistFollower.count({ where: { artistId } });
    const totalBuyers = await this.prisma.order.count({
      where: {
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        items: { some: { artistProduct: { artistId } } },
      },
    });

    // Average order value
    const avgOrder = await this.prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        items: { some: { artistProduct: { artistId } } },
      },
      _avg: { total: true },
    });

    // Total reviews
    const totalReviews = await this.prisma.review.count({
      where: { artistProduct: { artistId } },
    });

    const avgRating = await this.prisma.review.aggregate({
      where: { artistProduct: { artistId } },
      _avg: { rating: true },
    });

    // Referral stats
    const artistRecord = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: { userId: true },
    });

    let referralStats = { totalClicks: 0, referredUsers: 0, totalEarned: 0, pendingAmount: 0 };
    if (artistRecord) {
      const referral = await this.prisma.referral.findUnique({
        where: { ownerId: artistRecord.userId },
        include: { _count: { select: { referredUsers: true } } },
      });
      if (referral) {
        const refEarned = await this.prisma.commission.aggregate({
          where: { referralId: referral.id, status: 'PAID' },
          _sum: { amount: true },
        });
        const refPending = await this.prisma.commission.aggregate({
          where: { referralId: referral.id, status: 'PENDING' },
          _sum: { amount: true },
        });
        referralStats = {
          totalClicks: referral.totalClicks,
          referredUsers: referral._count.referredUsers,
          totalEarned: Number(refEarned._sum.amount || 0),
          pendingAmount: Number(refPending._sum.amount || 0),
        };
      }
    }

    return {
      topProducts: topProductsWithNames,
      followersChart,
      totalFollowers,
      totalBuyers,
      averageOrderValue: Number(avgOrder._avg.total || 0),
      totalReviews,
      averageRating: avgRating._avg.rating || 0,
      referralStats,
    };
  }
}
