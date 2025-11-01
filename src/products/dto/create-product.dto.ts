import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Café Americano' })
  @IsString()
  public name: string;

  @ApiProperty({ example: 3500 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Type(() => Number)
  public price: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  public stock: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  public categoryId?: number;

  @ApiProperty({ example: ['https://example.com/image.jpg'], required: false })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  public image?: string[];
}
