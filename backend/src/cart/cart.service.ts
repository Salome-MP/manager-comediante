import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private cartInclude = {
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
      orderBy: { createdAt: 'desc' as const },
    },
  };

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: this.cartInclude,
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: this.cartInclude,
      });
    }

    return this.formatCartWithTotals(cart);
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId);

    // Verify the artist product exists and is active
    const artistProduct = await this.prisma.artistProduct.findUnique({
      where: { id: dto.artistProductId },
    });

    if (!artistProduct || !artistProduct.isActive) {
      throw new NotFoundException('Producto no encontrado o no disponible');
    }

    // Check if the same artistProductId + variantSelection already exists in the cart
    const variantSelection = dto.variantSelection && Object.keys(dto.variantSelection).length > 0
      ? dto.variantSelection
      : null;
    const cartItems = await this.prisma.cartItem.findMany({
      where: {
        cartId: cart.id,
        artistProductId: dto.artistProductId,
      },
    });
    const existingItem = cartItems.find(
      (item) => JSON.stringify(item.variantSelection) === JSON.stringify(variantSelection),
    );

    if (existingItem) {
      // Update quantity and personalization
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + (dto.quantity ?? 1),
          personalization: dto.personalization ?? existingItem.personalization,
        },
      });

      // If new customizations are provided, replace existing ones
      if (dto.customizations && dto.customizations.length > 0) {
        await this.prisma.cartItemCustomization.deleteMany({
          where: { cartItemId: existingItem.id },
        });

        await this.prisma.cartItemCustomization.createMany({
          data: dto.customizations.map((c) => ({
            cartItemId: existingItem.id,
            type: c.type,
            price: new Prisma.Decimal(c.price),
          })),
        });
      }
    } else {
      // Create new cart item
      const cartItem = await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          artistProductId: dto.artistProductId,
          quantity: dto.quantity ?? 1,
          variantSelection: variantSelection ?? undefined,
          personalization: dto.personalization,
        },
      });

      // Create customizations if provided
      if (dto.customizations && dto.customizations.length > 0) {
        await this.prisma.cartItemCustomization.createMany({
          data: dto.customizations.map((c) => ({
            cartItemId: cartItem.id,
            type: c.type,
            price: new Prisma.Decimal(c.price),
          })),
        });
      }
    }

    return this.getCart(userId);
  }

  async updateItemQuantity(
    userId: string,
    cartItemId: string,
    quantity: number,
  ) {
    const cartItem = await this.findCartItemForUser(userId, cartItemId);

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: cartItem.id } });
      return this.getCart(userId);
    }

    await this.prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, cartItemId: string) {
    const cartItem = await this.findCartItemForUser(userId, cartItemId);

    await this.prisma.cartItem.delete({ where: { id: cartItem.id } });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return this.getCart(userId);
  }

  // ─── Private Helpers ───────────────────────────────────────

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  private async findCartItemForUser(userId: string, cartItemId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem) {
      throw new NotFoundException('Item del carrito no encontrado');
    }

    if (cartItem.cart.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este item',
      );
    }

    return cartItem;
  }

  private formatCartWithTotals(cart: any) {
    let subtotal = 0;
    let customizationsTotal = 0;

    const items = cart.items.map((item: any) => {
      const unitPrice = Number(item.artistProduct.salePrice);
      const itemCustomizationsTotal = item.customizations.reduce(
        (sum: number, c: any) => sum + Number(c.price),
        0,
      );
      const itemTotal = unitPrice * item.quantity + itemCustomizationsTotal;

      subtotal += unitPrice * item.quantity;
      customizationsTotal += itemCustomizationsTotal;

      return {
        ...item,
        unitPrice,
        customizationsTotal: itemCustomizationsTotal,
        itemTotal,
      };
    });

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      itemCount: items.length,
      subtotal,
      customizationsTotal,
      total: subtotal + customizationsTotal,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
