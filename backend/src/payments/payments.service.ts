import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private client: MercadoPagoConfig;
  private readonly logger = new Logger(PaymentsService.name);
  private readonly frontendUrl: string;
  private readonly backendUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {
    this.client = new MercadoPagoConfig({
      accessToken: this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN', ''),
    });
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    this.backendUrl = this.configService.get<string>('BACKEND_URL', '');
  }

  async createOrderPreference(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            artistProduct: { include: { product: true, artist: true } },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.userId !== userId) throw new NotFoundException('Orden no encontrada');

    const preference = new Preference(this.client);

    const items = order.items.map((item) => ({
      id: item.id,
      title: item.artistProduct.product.name,
      description: `${item.artistProduct.artist.stageName}${item.variantSelection ? ' - ' + Object.entries(item.variantSelection as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(', ') : ''}`,
      quantity: item.quantity,
      unit_price: Number(item.unitPrice),
      currency_id: 'PEN',
    }));

    // Add shipping as an item
    if (Number(order.shippingCost) > 0) {
      items.push({
        id: 'shipping',
        title: 'Envio',
        description: 'Costo de envio',
        quantity: 1,
        unit_price: Number(order.shippingCost),
        currency_id: 'PEN',
      });
    }

    // Add tax as an item
    if (Number(order.tax) > 0) {
      items.push({
        id: 'tax',
        title: 'IGV (18%)',
        description: 'Impuesto General a las Ventas',
        quantity: 1,
        unit_price: Number(order.tax),
        currency_id: 'PEN',
      });
    }

    const response = await preference.create({
      body: {
        items,
        payer: {
          email: order.user.email,
          name: order.user.firstName,
          surname: order.user.lastName,
        },
        back_urls: {
          success: `${this.frontendUrl}/confirmacion/${order.id}?status=approved`,
          failure: `${this.frontendUrl}/confirmacion/${order.id}?status=failure`,
          pending: `${this.frontendUrl}/confirmacion/${order.id}?status=pending`,
        },
        ...(this.frontendUrl.includes('localhost') ? {} : { auto_return: 'approved' as const }),
        external_reference: order.id,
        ...(this.backendUrl ? {
          notification_url: `${this.backendUrl}/api/payments/webhook`,
        } : {}),
      },
    });

    this.logger.log(`Preference created: id=${response.id}, init_point=${response.init_point}, sandbox=${response.sandbox_init_point}`);

    // Build sandbox URL from preference ID as fallback (SDK sometimes returns null for sandbox_init_point)
    const sandboxUrl = response.sandbox_init_point
      || `https://sandbox.mercadopago.com.pe/checkout/v1/redirect?pref_id=${response.id}`;

    return {
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: sandboxUrl,
    };
  }

  async createTicketPreference(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        show: { include: { artist: true } },
        user: true,
      },
    });

    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    if (ticket.userId !== userId) throw new NotFoundException('Ticket no encontrado');

    const preference = new Preference(this.client);

    try {
      const response = await preference.create({
        body: {
          items: [
            {
              id: ticket.id,
              title: `Entrada - ${ticket.show.name}`,
              description: `${ticket.show.artist?.stageName || 'Artista'} en ${ticket.show.venue}`,
              quantity: 1,
              unit_price: Number(ticket.price),
              currency_id: 'PEN',
            },
          ],
          payer: {
            email: ticket.user.email,
            name: ticket.user.firstName || '',
            surname: ticket.user.lastName || '',
          },
          back_urls: {
            success: `${this.frontendUrl}/mis-entradas?status=approved`,
            failure: `${this.frontendUrl}/mis-entradas?status=failure`,
            pending: `${this.frontendUrl}/mis-entradas?status=pending`,
          },
          ...(this.frontendUrl.includes('localhost') ? {} : { auto_return: 'approved' as const }),
          external_reference: `ticket:${ticket.id}`,
          ...(this.backendUrl ? {
            notification_url: `${this.backendUrl}/api/payments/webhook`,
          } : {}),
        },
      });

      this.logger.log(`Ticket preference created: id=${response.id}, sandbox=${response.sandbox_init_point}`);

      const sandboxUrl = response.sandbox_init_point
        || `https://sandbox.mercadopago.com.pe/checkout/v1/redirect?pref_id=${response.id}`;

      return {
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: sandboxUrl,
      };
    } catch (error: any) {
      this.logger.error(
        `Error creating ticket preference: ${error.message}`,
        error.cause || error.stack,
      );
      throw error;
    }
  }

  async handleWebhook(body: any) {
    this.logger.log(`Webhook received: ${JSON.stringify(body)}`);

    if (body.type === 'payment') {
      const paymentApi = new Payment(this.client);
      const payment = await paymentApi.get({ id: body.data.id });

      if (!payment || !payment.external_reference) return { ok: true };

      const externalRef = payment.external_reference;
      const paymentId = String(payment.id);
      const paymentMethod = payment.payment_method_id || 'unknown';
      const status = payment.status;

      // Handle ticket payment
      if (externalRef.startsWith('ticket:')) {
        const ticketId = externalRef.replace('ticket:', '');
        if (status === 'approved') {
          const ticket = await this.prisma.ticket.update({
            where: { id: ticketId },
            data: { paymentId },
            include: {
              show: { include: { artist: true } },
              user: true,
            },
          });

          // Send ticket confirmation email
          await this.emailService.sendTicketConfirmation(ticket.user.email, {
            showName: ticket.show.name,
            venue: ticket.show.venue,
            date: new Date(ticket.show.date).toLocaleDateString('es-PE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            qrCode: ticket.qrCode || ticket.id,
            ticketPrice: Number(ticket.price),
          });

          // Create artist commission for this ticket
          const ticketPrice = Number(ticket.price);
          const platformFeeRate = Number(ticket.show.platformFee || 10);
          const artistRate = 100 - platformFeeRate;
          const artistAmount = Math.round(ticketPrice * artistRate) / 100;

          if (artistAmount > 0) {
            await this.prisma.commission.create({
              data: {
                ticketId: ticket.id,
                amount: artistAmount,
                rate: artistRate,
                type: 'ticket',
                artistId: ticket.show.artist.id,
              },
            });
          }

          // Notify buyer
          await this.notificationsService.create({
            userId: ticket.userId,
            type: NotificationType.ORDER_CONFIRMATION,
            title: 'Entrada confirmada!',
            message: `Tu entrada para "${ticket.show.name}" ha sido confirmada. Revisa tu email.`,
            data: { ticketId: ticket.id, showId: ticket.showId },
          });
        }
        return { ok: true };
      }

      // Handle order payment
      const orderId = externalRef;
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: {
            include: {
              artistProduct: { include: { product: true, artist: { include: { user: true } } } },
              customizations: true,
            },
          },
          referral: { include: { owner: true } },
        },
      });

      if (!order) return { ok: true };

      // Prevent duplicate processing (webhook can fire multiple times)
      if (order.status !== 'PENDING') {
        this.logger.log(`Order ${orderId} already processed (status: ${order.status}), skipping`);
        return { ok: true };
      }

      if (status === 'approved') {
        // Update order to PAID
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'PAID', paymentId, paymentMethod },
        });

        // Create artist commissions
        await this.createArtistCommissions(order);

        // Create referral commission if applicable
        if (order.referral) {
          await this.createReferralCommission(order);
        }

        // Send order confirmation email to buyer
        await this.emailService.sendOrderConfirmation(order.user.email, {
          id: order.id,
          orderNumber: order.orderNumber,
          total: Number(order.total),
          items: order.items.map((i) => ({
            name: i.artistProduct.product.name,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
          })),
        });

        // Send notification to buyer
        await this.notificationsService.create({
          userId: order.userId,
          type: NotificationType.ORDER_CONFIRMATION,
          title: 'Pedido confirmado',
          message: `Tu pedido ${order.orderNumber} ha sido pagado exitosamente.`,
          data: { orderId: order.id },
        });

        // Notify each artist about the sale
        const artistMap = new Map<string, typeof order.items>();
        for (const item of order.items) {
          const artistId = item.artistProduct.artistId;
          if (!artistMap.has(artistId)) artistMap.set(artistId, []);
          artistMap.get(artistId)!.push(item);
        }

        const notifDiscountRatio = Number(order.subtotal) > 0 ? Number(order.discount || 0) / Number(order.subtotal) : 0;
        for (const [, items] of artistMap) {
          const artist = items[0].artistProduct.artist;
          const artistItems = items.map((i) => {
            const effectivePrice = Number(i.unitPrice) * (1 - notifDiscountRatio);
            const margin = effectivePrice - Number(i.artistProduct.product.manufacturingCost);
            const commission = Math.max(0, margin * (Number(i.artistProduct.artistCommission) / 100) * i.quantity);
            return {
              name: i.artistProduct.product.name,
              quantity: i.quantity,
              commission,
            };
          });
          const totalCommission = artistItems.reduce((sum, i) => sum + i.commission, 0);

          await this.emailService.sendNewSaleNotification(
            artist.user.email,
            artist.stageName,
            { orderNumber: order.orderNumber, items: artistItems, totalCommission },
          );

          await this.notificationsService.create({
            userId: artist.userId,
            type: NotificationType.NEW_SALE,
            title: 'Nueva venta!',
            message: `Se vendieron ${items.length} producto(s) en el pedido ${order.orderNumber}. Comision: S/. ${totalCommission.toFixed(2)}`,
            data: { orderId: order.id },
          });
        }
      } else if (status === 'rejected' || status === 'cancelled') {
        // Only restore stock if order was still PENDING (not already processed)
        if (order.status === 'PENDING') {
          // Restore stock for each item
          for (const item of order.items) {
            await this.prisma.artistProduct.update({
              where: { id: item.artistProductId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED', paymentId, paymentMethod },
        });

        // Notify buyer about payment failure
        await this.notificationsService.create({
          userId: order.userId,
          type: NotificationType.ORDER_CONFIRMATION,
          title: 'Pago rechazado',
          message: `El pago de tu pedido ${order.orderNumber} fue rechazado. El stock ha sido restaurado.`,
          data: { orderId: order.id },
        });
      }
    }

    return { ok: true };
  }

  private async createArtistCommissions(order: any) {
    // Calculate discount ratio to distribute coupon discount proportionally
    const orderSubtotal = Number(order.subtotal);
    const orderDiscount = Number(order.discount || 0);
    const discountRatio = orderSubtotal > 0 ? orderDiscount / orderSubtotal : 0;

    for (const item of order.items) {
      const effectivePrice = Number(item.unitPrice) * (1 - discountRatio);
      const margin = effectivePrice - Number(item.artistProduct.product.manufacturingCost);
      const commissionRate = Number(item.artistProduct.artistCommission);
      const commissionAmount = Math.max(0, (margin * commissionRate / 100) * item.quantity);

      if (commissionAmount > 0) {
        await this.prisma.commission.create({
          data: {
            orderId: order.id,
            amount: Math.round(commissionAmount * 100) / 100,
            rate: commissionRate,
            type: 'artist',
            artistId: item.artistProduct.artistId,
          },
        });
      }

      // Customization commission (100% goes to artist)
      const custTotal = (item.customizations || []).reduce(
        (sum: number, c: { price: number | string }) => sum + Number(c.price), 0,
      );
      if (custTotal > 0) {
        await this.prisma.commission.create({
          data: {
            orderId: order.id,
            amount: Math.round(custTotal * 100) / 100,
            rate: 100,
            type: 'customization',
            artistId: item.artistProduct.artistId,
          },
        });
      }
    }
  }

  private async createReferralCommission(order: any) {
    const referral = order.referral;
    const commissionRate = Number(referral.commissionRate);
    const effectiveSubtotal = Number(order.subtotal) - Number(order.discount || 0);
    const commissionAmount = effectiveSubtotal * commissionRate / 100;

    if (commissionAmount > 0) {
      await this.prisma.commission.create({
        data: {
          orderId: order.id,
          amount: commissionAmount,
          rate: commissionRate,
          type: 'referral',
          referralId: referral.id,
        },
      });

      // Notify referral owner
      await this.emailService.sendReferralCommissionNotification(
        referral.owner.email,
        {
          orderNumber: order.orderNumber,
          commissionAmount,
          referralCode: referral.code,
        },
      );

      await this.notificationsService.create({
        userId: referral.ownerId,
        type: NotificationType.REFERRAL_COMMISSION,
        title: 'Comision por referido!',
        message: `Ganaste S/. ${commissionAmount.toFixed(2)} por referido en el pedido ${order.orderNumber}.`,
        data: { orderId: order.id, referralCode: referral.code },
      });
    }
  }
}
