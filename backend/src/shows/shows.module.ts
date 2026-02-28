import { Module } from '@nestjs/common';
import { ShowsController } from './shows.controller';
import { ShowsService } from './shows.service';
import { TicketExpirationService } from './ticket-expiration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ShowsController],
  providers: [ShowsService, TicketExpirationService],
  exports: [ShowsService],
})
export class ShowsModule {}
