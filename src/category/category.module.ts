import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [CategoryController],
  providers: [],
  imports: [NatsModule],
})
export class CategoryModule {}
