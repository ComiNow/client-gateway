import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [FilesController],
  providers: [],
  imports: [NatsModule],
})
export class FilesModule {}
