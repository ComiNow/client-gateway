import {
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from '../config';
import { CreatePaymentConfigDto } from './dto/payment-config.dto';

@ApiTags('payment-config')
@Controller('payment-config')
export class PaymentConfigController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) { }

  @Post()
  createProduct(@Body() createPaymentConfigDto: CreatePaymentConfigDto) {
    return this.client.send('create.payment.config', createPaymentConfigDto);
  }

}
