import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderExpirationService } from './order-expiration.service';
import { ReceiptService } from './receipt.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [NotificationsModule, CouponsModule],
  controllers: [OrdersController, ReportsController],
  providers: [OrdersService, OrderExpirationService, ReceiptService, ReportsService],
  exports: [OrdersService, ReceiptService, ReportsService],
})
export class OrdersModule {}
