import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private couponsService: CouponsService,
  ) {}

  async createFromCart(userId: string, dto: CreateOrderDto) {
    // 1. Get user's cart with all items and customizations
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            artistProduct: {
              include: {
                product: true,
                artist: true,
              },
            },
            customizations: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // 2. Validate stock availability for each item
    for (const item of cart.items) {
      if (item.artistProduct.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${item.artistProduct.product.name}". ` +
            `Disponible: ${item.artistProduct.stock}, solicitado: ${item.quantity}`,
        );
      }
    }

    // 3. Calculate totals
    let subtotal = 0;
    for (const item of cart.items) {
      const itemPrice = Number(item.artistProduct.salePrice) * item.quantity;
      const customizationsPrice = item.customizations.reduce(
        (sum, c) => sum + Number(c.price),
        0,
      );
      subtotal += itemPrice + customizationsPrice;
    }

    const shippingCost = 15; // flat rate

    // Apply coupon discount if provided
    let couponDiscount = 0;
    let couponId: string | null = null;
    if (dto.couponId) {
      const coupon = await this.prisma.coupon.findUnique({ where: { id: dto.couponId } });
      if (coupon && coupon.isActive) {
        // Re-validate with current subtotal
        const validation = await this.couponsService.validate(coupon.code, subtotal);
        couponDiscount = validation.discount;
        couponId = coupon.id;
      }
    }

    const discountedSubtotal = subtotal - couponDiscount;
    const tax = Math.round((discountedSubtotal + shippingCost) * 0.18 * 100) / 100; // 18% IGV (sobre subtotal + envío)
    const total = Math.round((discountedSubtotal + shippingCost + tax) * 100) / 100;

    // 4. Generate order number
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
    const orderNumber = `ORD-${dateStr}-${randomDigits}`;

    // 5. Auto-detect referral: only on user's FIRST order
    let referralId: string | null = null;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referredById: true },
    });

    if (user?.referredById) {
      // Check if this is the user's first order (no previous paid orders)
      const PAID_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
      const previousOrders = await this.prisma.order.count({
        where: { userId, status: { in: PAID_STATUSES } },
      });

      if (previousOrders === 0) {
        referralId = user.referredById;
      }
    }

    // 6. Execute transaction: create order, decrement stock, clear cart
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order with 1-hour expiration
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          shippingCost,
          tax,
          discount: couponDiscount,
          total,
          couponId,
          shippingName: dto.shippingName,
          shippingAddress: dto.shippingAddress,
          shippingCity: dto.shippingCity,
          shippingState: dto.shippingState,
          shippingZip: dto.shippingZip,
          shippingPhone: dto.shippingPhone,
          invoiceType: dto.invoiceType,
          ruc: dto.ruc,
          referralId,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          items: {
            create: cart.items.map((item) => {
              const unitPrice = Number(item.artistProduct.salePrice);
              const totalPrice = unitPrice * item.quantity;
              return {
                artistProductId: item.artistProductId,
                quantity: item.quantity,
                unitPrice,
                totalPrice,
                variantSelection: item.variantSelection ?? undefined,
                personalization: item.personalization,
                customizations: {
                  create: item.customizations.map((c) => ({
                    type: c.type,
                    price: Number(c.price),
                    notes: (c as any).notes ?? null,
                  })),
                },
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              artistProduct: {
                include: { product: true, artist: true },
              },
              customizations: true,
            },
          },
        },
      });

      // Decrement stock for each item
      for (const item of cart.items) {
        await tx.artistProduct.update({
          where: { id: item.artistProductId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Increment coupon usage inside transaction
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return createdOrder;
    });

    return order;
  }

  async findAll(
    page = 1,
    limit = 20,
    filters: {
      status?: OrderStatus;
      artistId?: string;
      fromDate?: string;
      toDate?: string;
      search?: string;
    } = {},
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.artistId) {
      where.items = {
        some: {
          artistProduct: { artistId: filters.artistId },
        },
      };
    }

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        const end = new Date(filters.toDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { user: { firstName: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          items: {
            include: {
              artistProduct: {
                include: { product: true, artist: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: orders, total, page, limit };
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          items: {
            include: {
              artistProduct: {
                include: { product: true, artist: true },
              },
              customizations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return { data: orders, total, page, limit };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        items: {
          include: {
            artistProduct: {
              include: { product: true, artist: true },
            },
            customizations: true,
          },
        },
        commissions: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }
}
