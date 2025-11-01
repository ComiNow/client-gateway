import { Module } from '@nestjs/common';
import { PaymentConfigController } from './payments.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [PaymentConfigController],
  providers: [],
  imports: [NatsModule],
})
export class PaymentConfigModule {}
