import { Module } from '@nestjs/common';
import { CustomizationController } from './customization.controller';
import { ThemesController } from './themes.controller';
import { NatsModule } from '../transports/nats.module';
import { CustomizationFilesController } from './customization-files.controller';

@Module({
  controllers: [CustomizationController, ThemesController, CustomizationFilesController],
  imports: [NatsModule],
})
export class CustomizationModule { }