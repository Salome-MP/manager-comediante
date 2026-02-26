import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument = require('pdfkit');

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  async generateReceipt(orderId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        items: {
          include: {
            artistProduct: { include: { product: true, artist: true } },
            customizations: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');

    const isBoleta = order.invoiceType !== 'FACTURA';
    const docTitle = isBoleta ? 'BOLETA DE VENTA' : 'FACTURA';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ──────────────────────────────────
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Comediantes.com', 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Plataforma de merchandising para comediantes', 50, 75)
        .text('Lima, Peru', 50, 88);

      // Document type box
      doc
        .roundedRect(400, 45, 150, 55, 4)
        .lineWidth(1)
        .stroke('#7c3aed');

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#7c3aed')
        .text(docTitle, 400, 55, { width: 150, align: 'center' });

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#333')
        .text(order.orderNumber, 400, 72, { width: 150, align: 'center' })
        .text(
          new Date(order.createdAt).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
          400,
          85,
          { width: 150, align: 'center' },
        );

      // ── Customer info ──────────────────────────────────
      const customerY = 130;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000')
        .text('Datos del cliente', 50, customerY);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#333')
        .text(`Nombre: ${order.user.firstName} ${order.user.lastName}`, 50, customerY + 18)
        .text(`Email: ${order.user.email}`, 50, customerY + 32)
        .text(`Direccion: ${order.shippingAddress}, ${order.shippingCity}`, 50, customerY + 46);

      if (order.ruc) {
        doc.text(`RUC: ${order.ruc}`, 50, customerY + 60);
      }

      // ── Table header ──────────────────────────────────
      const tableY = order.ruc ? customerY + 85 : customerY + 75;

      doc
        .rect(50, tableY, 495, 22)
        .fill('#7c3aed');

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#fff')
        .text('Producto', 55, tableY + 6)
        .text('Artista', 220, tableY + 6)
        .text('Variantes', 310, tableY + 6)
        .text('Cant.', 360, tableY + 6)
        .text('P. Unit.', 405, tableY + 6)
        .text('Total', 470, tableY + 6);

      // ── Table rows ──────────────────────────────────
      let rowY = tableY + 22;
      doc.fillColor('#333').font('Helvetica').fontSize(8);

      for (const item of order.items) {
        const productName = item.artistProduct.product.name;
        const artistName = item.artistProduct.artist.stageName;
        const unitPrice = Number(item.unitPrice);
        const totalPrice = Number(item.totalPrice);
        const custTotal = item.customizations.reduce((s, c) => s + Number(c.price), 0);

        // Alternating row background
        if ((order.items.indexOf(item) % 2) === 0) {
          doc.rect(50, rowY, 495, 20).fill('#f8f8fc');
          doc.fillColor('#333');
        }

        doc
          .text(productName.length > 25 ? productName.slice(0, 25) + '...' : productName, 55, rowY + 6, { width: 160 })
          .text(artistName.length > 14 ? artistName.slice(0, 14) + '...' : artistName, 220, rowY + 6)
          .text(
            item.variantSelection
              ? Object.entries(item.variantSelection as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(', ')
              : '-',
            310, rowY + 6,
          )
          .text(String(item.quantity), 365, rowY + 6)
          .text(`S/. ${unitPrice.toFixed(2)}`, 400, rowY + 6)
          .text(`S/. ${totalPrice.toFixed(2)}`, 465, rowY + 6);

        rowY += 20;

        // Customizations sub-rows
        for (const cust of item.customizations) {
          doc
            .fontSize(7)
            .fillColor('#7c3aed')
            .text(`  + ${cust.type.replace(/_/g, ' ')}`, 65, rowY + 4)
            .text(`S/. ${Number(cust.price).toFixed(2)}`, 465, rowY + 4);
          doc.fillColor('#333').fontSize(8);
          rowY += 14;
        }
      }

      // ── Totals ──────────────────────────────────
      rowY += 10;
      doc
        .moveTo(350, rowY)
        .lineTo(545, rowY)
        .lineWidth(0.5)
        .stroke('#ddd');

      rowY += 8;
      doc.fontSize(9).font('Helvetica');
      doc.text('Subtotal:', 380, rowY).text(`S/. ${Number(order.subtotal).toFixed(2)}`, 465, rowY);
      rowY += 16;
      doc.text('Envio:', 380, rowY).text(`S/. ${Number(order.shippingCost).toFixed(2)}`, 465, rowY);
      rowY += 16;
      doc.text('IGV (18%):', 380, rowY).text(`S/. ${Number(order.tax).toFixed(2)}`, 465, rowY);
      rowY += 20;

      doc
        .moveTo(350, rowY)
        .lineTo(545, rowY)
        .lineWidth(1)
        .stroke('#7c3aed');

      rowY += 8;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#7c3aed')
        .text('TOTAL:', 380, rowY)
        .text(`S/. ${Number(order.total).toFixed(2)}`, 455, rowY);

      // ── Payment info ──────────────────────────────────
      rowY += 35;
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666')
        .text(`Estado: ${order.status}`, 50, rowY)
        .text(`Metodo de pago: ${order.paymentMethod || 'Pendiente'}`, 50, rowY + 14)
        .text(`ID de pago: ${order.paymentId || '-'}`, 50, rowY + 28);

      // ── Footer ──────────────────────────────────
      doc
        .fontSize(8)
        .fillColor('#999')
        .text(
          'Gracias por tu compra en Comediantes.com - Documento generado automaticamente',
          50,
          750,
          { width: 495, align: 'center' },
        );

      doc.end();
    });
  }
}
