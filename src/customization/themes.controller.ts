import {
  Controller,
  Get,
  Post,
  Param,
  Inject,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { NATS_SERVICE } from 'src/config';

@Controller('customization/themes')
export class ThemesController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get()
  findAll() {
    return this.client.send({ cmd: 'find_all_themes' }, {}).pipe(
      catchError((err) => {
        throw new RpcException(err);
      }),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.client.send({ cmd: 'find_theme_by_id' }, { id }).pipe(
      catchError((err) => {
        throw new RpcException(err);
      }),
    );
  }

  @Post('seed')
  seedThemes() {
    return this.client.send({ cmd: 'seed_themes' }, {}).pipe(
      catchError((err) => {
        throw new RpcException(err);
      }),
    );
  }
}
