import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async findActive() {
    const now = new Date();
    const coupons = await this.prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    // Filter out coupons that reached max uses
    return coupons.filter(c => !c.maxUses || c.usedCount < c.maxUses);
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.coupon.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.coupon.count(),
    ]);
    return { data, total, page, limit };
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.toUpperCase().trim();

    // Validate percentage range
    if (dto.discountType === 'percentage' && dto.discountValue > 100) {
      throw new BadRequestException('El porcentaje no puede ser mayor a 100%');
    }

    // Check duplicate code
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      throw new BadRequestException(`Ya existe un cupon con el codigo "${code}"`);
    }

    return this.prisma.coupon.create({
      data: {
        code,
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minPurchase: dto.minPurchase,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Cupon no encontrado');

    // Validate percentage range
    const discountType = dto.discountType || coupon.discountType;
    const discountValue = dto.discountValue ?? Number(coupon.discountValue);
    if (discountType === 'percentage' && discountValue > 100) {
      throw new BadRequestException('El porcentaje no puede ser mayor a 100%');
    }

    const data: any = { ...dto };
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);
    // Don't allow changing code
    delete data.code;

    return this.prisma.coupon.update({ where: { id }, data });
  }

  async validate(code: string, subtotal: number, userId?: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });

    if (!coupon) throw new BadRequestException('Cupon no valido');
    if (!coupon.isActive) throw new BadRequestException('Cupon inactivo');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Cupon expirado');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Cupon agotado');
    if (coupon.minPurchase && subtotal < Number(coupon.minPurchase)) {
      throw new BadRequestException(`El pedido minimo para este cupon es S/. ${Number(coupon.minPurchase).toFixed(2)}`);
    }

    // Check if user already used this coupon
    if (userId) {
      const alreadyUsed = await this.prisma.order.findFirst({
        where: {
          userId,
          couponId: coupon.id,
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      });
      if (alreadyUsed) {
        throw new BadRequestException('Ya usaste este cupon en un pedido anterior');
      }
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = subtotal * Number(coupon.discountValue) / 100;
    } else {
      discount = Math.min(Number(coupon.discountValue), subtotal);
    }

    return {
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discount: Math.round(discount * 100) / 100,
      description: coupon.description,
    };
  }

  async use(couponId: string) {
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  }
}
