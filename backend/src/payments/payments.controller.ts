import {
  Controller, Post, Body, Param, UseGuards, Headers, Query,
  Logger, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { createHmac } from 'crypto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  private readonly webhookSecret: string;

  constructor(
    private paymentsService: PaymentsService,
    private configService: ConfigService,
  ) {
    this.webhookSecret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET', '');
  }

  @Post('order/:orderId/preference')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear preferencia de pago para una orden' })
  createOrderPreference(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createOrderPreference(orderId, userId);
  }

  @Post('ticket/:ticketId/preference')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear preferencia de pago para un ticket' })
  createTicketPreference(
    @Param('ticketId') ticketId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createTicketPreference(ticketId, userId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook de Mercado Pago' })
  handleWebhook(
    @Body() body: any,
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
    @Query('data.id') dataId: string,
  ) {
    // Verify Mercado Pago webhook signature
    if (this.webhookSecret) {
      if (!xSignature) {
        this.logger.warn('Webhook received without x-signature header');
        throw new UnauthorizedException('Missing signature');
      }

      const isValid = this.verifyWebhookSignature(xSignature, xRequestId, dataId);
      if (!isValid) {
        this.logger.warn('Webhook signature verification failed');
        throw new UnauthorizedException('Invalid signature');
      }
    } else {
      this.logger.warn('MERCADOPAGO_WEBHOOK_SECRET not configured - skipping signature verification');
    }

    return this.paymentsService.handleWebhook(body);
  }

  /**
   * Verifies the Mercado Pago webhook signature using HMAC-SHA256.
   * @see https://www.mercadopago.com.pe/developers/es/docs/your-integrations/notifications/webhooks
   */
  private verifyWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
  ): boolean {
    try {
      // Parse x-signature header: "ts=<timestamp>,v1=<hash>"
      const parts: Record<string, string> = {};
      for (const part of xSignature.split(',')) {
        const [key, value] = part.split('=', 2);
        parts[key.trim()] = value?.trim() || '';
      }

      const ts = parts['ts'];
      const v1 = parts['v1'];

      if (!ts || !v1) return false;

      // Build the manifest string
      // Format: id:{data.id};request-id:{x-request-id};ts:{ts};
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

      // Generate HMAC-SHA256 hash
      const hash = createHmac('sha256', this.webhookSecret)
        .update(manifest)
        .digest('hex');

      return hash === v1;
    } catch (error) {
      this.logger.error(`Signature verification error: ${error}`);
      return false;
    }
  }
}
