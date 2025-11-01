import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { HealthCheckModule } from './health-check/health-check.module';
import { NatsModule } from './transports/nats.module';
import { CategoryModule } from './category/category.module';
import { FilesModule } from './files/files.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guards/auth.guard';
import { BusinessOwnershipGuard } from './auth/guards/business-ownership.guard';
import { PaymentConfigModule } from './payment-config/payments.module';
import { CustomizationModule } from './customization/customization.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [
    NatsModule,
    AuthModule,
    HealthCheckModule,
    OrdersModule,
    ProductsModule,
    CategoryModule,
    FilesModule,
    PaymentConfigModule,
    CustomizationModule,
    RolesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: BusinessOwnershipGuard,
    },
  ],
})
export class AppModule {}
