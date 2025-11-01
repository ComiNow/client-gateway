import { IsString, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentCredentialsDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  webhookSecret: string;
}

export class CreatePaymentConfigDto {

  @IsString()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  @IsNotEmpty()
  paymentProvider: string;

  @ValidateNested()
  @Type(() => PaymentCredentialsDto)
  @IsNotEmpty()
  credentials: PaymentCredentialsDto;
}