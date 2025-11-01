import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, IsStrongPassword } from 'class-validator';

export enum IdentificationType {
  CC = 'CC',
  CE = 'CE',
  PA = 'PA',
  TE = 'TE',
}

export class RegisterBusinessDto {
  @ApiProperty({ example: 'CoffeeNow' })
  @IsString()
  businessName: string;

  @ApiProperty({ example: 'contacto@coffeenow.com' })
  @IsEmail()
  businessEmail: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  businessPhone: string;

  @ApiProperty({ example: 'Julián Andrés Rodríguez Guerra' })
  @IsString()
  adminFullName: string;

  @ApiProperty({ example: 'julian@coffeenow.com' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: '3007654321' })
  @IsString()
  adminPhone: string;

  @ApiProperty({ example: '1094931275' })
  @IsString()
  adminIdentificationNumber: string;

  @ApiProperty({ enum: IdentificationType, example: 'CC' })
  @IsEnum(IdentificationType)
  adminIdentificationType: IdentificationType;

  @ApiProperty({ example: 'CocoYmax4325*' })
  @IsStrongPassword()
  adminPassword: string;

  @ApiProperty({ example: 'Cundinamarca' })
  @IsString()
  locationState: string;

  @ApiProperty({ example: 'Bogotá' })
  @IsString()
  locationCity: string;

  @ApiProperty({ example: '110111' })
  @IsString()
  locationPostalCode: string;

  @ApiProperty({ example: 'Calle 123 #45-67' })
  @IsString()
  locationAddress: string;
}
