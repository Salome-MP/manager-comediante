import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@comediantes.com');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: `"Comediantes.com" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
    }
  }

  async sendOrderConfirmation(email: string, order: {
    id: string;
    orderNumber: string;
    total: number;
    items: { name: string; quantity: number; unitPrice: number }[];
  }) {
    const itemsHtml = order.items
      .map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee">S/. ${i.unitPrice.toFixed(2)}</td></tr>`)
      .join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Confirmacion de Pedido</h2>
        <p>Tu pedido <strong>${order.orderNumber}</strong> ha sido recibido.</p>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Producto</th><th style="padding:8px">Cant.</th><th style="padding:8px">Precio</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="font-size:18px;font-weight:bold;margin-top:16px">Total: S/. ${order.total.toFixed(2)}</p>
        <p><a href="${this.frontendUrl}/confirmacion/${order.id}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px">Ver mi pedido</a></p>
        <p style="color:#888;font-size:12px">Gracias por tu compra en Comediantes.com</p>
      </div>
    `;

    await this.send(email, `Pedido ${order.orderNumber} confirmado`, html);
  }

  async sendNewSaleNotification(artistEmail: string, artistName: string, order: {
    orderNumber: string;
    items: { name: string; quantity: number; commission: number }[];
    totalCommission: number;
  }) {
    const itemsHtml = order.items
      .map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee">S/. ${i.commission.toFixed(2)}</td></tr>`)
      .join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Nueva Venta, ${artistName}!</h2>
        <p>Se ha realizado una nueva compra con tus productos (Pedido <strong>${order.orderNumber}</strong>).</p>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Producto</th><th style="padding:8px">Cant.</th><th style="padding:8px">Comision</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="font-size:18px;font-weight:bold;margin-top:16px">Comision total: S/. ${order.totalCommission.toFixed(2)}</p>
        <p><a href="${this.frontendUrl}/dashboard/ventas" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px">Ver mis ventas</a></p>
      </div>
    `;

    await this.send(artistEmail, `Nueva venta - Pedido ${order.orderNumber}`, html);
  }

  async sendReferralCommissionNotification(email: string, data: {
    orderNumber: string;
    commissionAmount: number;
    referralCode: string;
  }) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Comision por Referido!</h2>
        <p>Alguien uso tu codigo de referido <strong>${data.referralCode}</strong> en el pedido <strong>${data.orderNumber}</strong>.</p>
        <p style="font-size:18px;font-weight:bold">Has ganado: S/. ${data.commissionAmount.toFixed(2)}</p>
        <p><a href="${this.frontendUrl}/dashboard/referidos" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px">Ver mis referidos</a></p>
      </div>
    `;

    await this.send(email, `Comision por referido - S/. ${data.commissionAmount.toFixed(2)}`, html);
  }

  async sendPasswordRecovery(email: string, token: string) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Recuperar Contraseña</h2>
        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px">Restablecer contraseña</a></p>
        <p style="color:#888;font-size:12px">Si no solicitaste este cambio, ignora este correo. El enlace expira en 1 hora.</p>
      </div>
    `;

    await this.send(email, 'Recuperar contraseña - Comediantes.com', html);
  }

  async sendArtistBlast(
    email: string,
    fanName: string,
    artistName: string,
    title: string,
    message: string,
  ) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">${title}</h2>
        <p>Hola ${fanName},</p>
        <p><strong>${artistName}</strong> tiene un mensaje para ti:</p>
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;white-space:pre-line">
          ${message}
        </div>
        <p><a href="${this.frontendUrl}/artistas" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:6px">Ver artista</a></p>
        <p style="color:#888;font-size:12px">Recibiste este email porque sigues a ${artistName} en Comediantes.com</p>
      </div>
    `;

    await this.send(email, `${artistName}: ${title}`, html);
  }

  async sendTicketConfirmation(email: string, data: {
    showName: string;
    venue: string;
    date: string;
    qrCode: string;
    ticketPrice: number;
  }) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Entrada Confirmada!</h2>
        <p>Tu entrada para <strong>${data.showName}</strong> ha sido confirmada.</p>
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Lugar:</strong> ${data.venue}</p>
          <p><strong>Fecha:</strong> ${data.date}</p>
          <p><strong>Precio:</strong> S/. ${data.ticketPrice.toFixed(2)}</p>
          <p><strong>Codigo QR:</strong> ${data.qrCode}</p>
        </div>
        <p style="color:#888;font-size:12px">Presenta este codigo QR en la entrada del evento.</p>
      </div>
    `;

    await this.send(email, `Entrada confirmada - ${data.showName}`, html);
  }

  // ─── FULFILLMENT EMAILS ────────────────────────────────────

  async sendCustomizationFulfilled(email: string, data: {
    customerName: string;
    artistName: string;
    type: string;
    orderNumber: string;
    orderId: string;
    attachmentUrl?: string;
    notes?: string;
  }) {
    const typeLabel = data.type;
    const isVideo = typeLabel.toLowerCase().includes('video');
    const buttonLabel = isVideo ? 'Ver video' : `Ver ${typeLabel}`;

    const attachmentHtml = data.attachmentUrl
      ? `<p style="margin:16px 0"><a href="${data.attachmentUrl}" style="display:inline-block;padding:12px 24px;background:#3A5A8C;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px">${buttonLabel}</a></p>`
      : '';
    const notesHtml = data.notes
      ? `<div style="background:#f0f4fa;padding:14px 16px;border-radius:8px;margin:16px 0;border-left:4px solid #3A5A8C"><p style="margin:0;color:#2D4A6F;font-size:14px"><strong>Mensaje de ${data.artistName}:</strong> ${data.notes}</p></div>`
      : '';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1B2A4A">Tu ${typeLabel} esta listo!</h2>
        <p>Hola ${data.customerName},</p>
        <p><strong>${data.artistName}</strong> ha completado tu <strong>${typeLabel}</strong> del pedido <strong>#${data.orderNumber}</strong>.</p>
        ${notesHtml}
        ${attachmentHtml}
        <p style="margin-top:24px"><a href="${this.frontendUrl}/mi-cuenta" style="display:inline-block;padding:12px 24px;background:#1B2A4A;color:#fff;text-decoration:none;border-radius:8px">Ver mi pedido</a></p>
        <p style="color:#888;font-size:12px;margin-top:24px">Gracias por tu compra en Comediantes.com</p>
      </div>
    `;

    await this.send(email, `Tu ${typeLabel} de ${data.artistName} esta listo!`, html);
  }

  async sendOrderShipped(email: string, data: {
    orderNumber: string;
    carrier: string;
    trackingNumber: string;
    customerName: string;
  }) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Tu pedido esta en camino!</h2>
        <p>Hola ${data.customerName},</p>
        <p>Tu pedido <strong>${data.orderNumber}</strong> ha sido enviado.</p>
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Courier:</strong> ${data.carrier}</p>
          <p><strong>Numero de seguimiento:</strong> ${data.trackingNumber}</p>
        </div>
        <p style="color:#888;font-size:12px">Puedes rastrear tu envio con el numero de seguimiento en la web del courier.</p>
      </div>
    `;

    await this.send(email, `Pedido ${data.orderNumber} enviado`, html);
  }

  async sendOrderDelivered(email: string, data: {
    orderNumber: string;
    orderId: string;
    customerName: string;
  }) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Tu pedido fue entregado!</h2>
        <p>Hola ${data.customerName},</p>
        <p>Tu pedido <strong>${data.orderNumber}</strong> ha sido entregado. Esperamos que lo disfrutes!</p>
        <p><a href="${this.frontendUrl}/confirmacion/${data.orderId}" style="display:inline-block;padding:12px 24px;background:#1B2A4A;color:#fff;text-decoration:none;border-radius:6px">Ver mi pedido y dejar resena</a></p>
        <p style="color:#888;font-size:12px">Si tienes algun problema con tu pedido, puedes reportarlo desde tu cuenta.</p>
      </div>
    `;

    await this.send(email, `Pedido ${data.orderNumber} entregado`, html);
  }

  async sendVideoCallScheduled(email: string, data: {
    customerName: string;
    artistName: string;
    date: string;
    duration: number;
    meetingLink: string;
  }) {
    const dateStr = new Date(data.date).toLocaleDateString('es-PE', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Videollamada programada!</h2>
        <p>Hola ${data.customerName},</p>
        <p>Tu videollamada con <strong>${data.artistName}</strong> ha sido programada.</p>
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
          <p><strong>Fecha:</strong> ${dateStr}</p>
          <p><strong>Duracion:</strong> ${data.duration} minutos</p>
          ${data.meetingLink ? `<p><strong>Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}
        </div>
        <p style="color:#888;font-size:12px">Asegurate de estar listo unos minutos antes de la hora programada.</p>
      </div>
    `;

    await this.send(email, `Videollamada con ${data.artistName} programada`, html);
  }

  async sendReturnRequestUpdate(email: string, data: {
    customerName: string;
    orderNumber: string;
    status: string;
    adminNotes?: string;
  }) {
    const notesHtml = data.adminNotes
      ? `<div style="background:#f5f5f5;padding:12px;border-radius:8px;margin:12px 0"><p style="margin:0;color:#555">Nota del administrador: ${data.adminNotes}</p></div>`
      : '';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Actualizacion de tu solicitud de devolucion</h2>
        <p>Hola ${data.customerName},</p>
        <p>Tu solicitud de devolucion para el pedido <strong>${data.orderNumber}</strong> ha sido <strong>${data.status}</strong>.</p>
        ${notesHtml}
        <p><a href="${this.frontendUrl}/mi-cuenta" style="display:inline-block;padding:12px 24px;background:#1B2A4A;color:#fff;text-decoration:none;border-radius:6px">Ver mi cuenta</a></p>
        <p style="color:#888;font-size:12px">Si tienes preguntas, no dudes en contactarnos.</p>
      </div>
    `;

    await this.send(email, `Solicitud de devolucion ${data.status} - ${data.orderNumber}`, html);
  }
}
