import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [AuthController],
  providers: [AuthGuard],
  imports: [NatsModule],
  exports: [AuthGuard],
})
export class AuthModule {}
