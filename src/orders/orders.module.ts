import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { NatsModule } from 'src/transports/nats.module';
import { TablesController } from './tables.controller';

@Module({
  controllers: [OrdersController, TablesController],
  providers: [],
  imports: [
    NatsModule,
  ]
})
export class OrdersModule { }
