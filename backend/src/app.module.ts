import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ArtistsModule } from './artists/artists.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ShowsModule } from './shows/shows.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { ReferralsModule } from './referrals/referrals.module';
import { UploadModule } from './upload/upload.module';
import { SettingsModule } from './settings/settings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CouponsModule } from './coupons/coupons.module';
import { CommunityModule } from './community/community.module';
import { FulfillmentModule } from './fulfillment/fulfillment.module';
import { ReturnsModule } from './returns/returns.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ArtistsModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    ShowsModule,
    NotificationsModule,
    PaymentsModule,
    ReferralsModule,
    UploadModule,
    SettingsModule,
    ReviewsModule,
    WishlistModule,
    CouponsModule,
    CommunityModule,
    FulfillmentModule,
    ReturnsModule,
  ],
})
export class AppModule {}
