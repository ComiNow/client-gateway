import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Bebidas Calientes' })
  @IsString()
  public name: string;

  @ApiProperty({ example: 'https://example.com/image1.jpg', required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  public firstImage?: string;

  @ApiProperty({ example: 'https://example.com/image2.jpg', required: false })
  @IsOptional()
  @IsString()
  @IsUrl()
  public secondImage?: string;
}
