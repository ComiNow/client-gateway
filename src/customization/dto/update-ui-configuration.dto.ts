import {
  IsString,
  IsInt,
  IsArray,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUIConfigurationDto {
  @ApiProperty({
    example: 'Café Central',
    description: 'Nombre comercial de la marca que se mostrará a los clientes',
    required: false,
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  brand?: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/xxx/logo.png',
    description: 'URL del logo del negocio',
    required: false,
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({
    example: 'Inter',
    description: 'Fuente tipográfica principal',
    required: false,
  })
  @IsString()
  @IsOptional()
  font?: string;

  @ApiProperty({
    example: 16,
    description: 'Tamaño de fuente base en píxeles',
    required: false,
    minimum: 10,
  })
  @IsInt()
  @Min(10)
  @IsOptional()
  fontSize?: number;

  @ApiProperty({
    example: [
      'https://res.cloudinary.com/xxx/image1.jpg',
      'https://res.cloudinary.com/xxx/image2.jpg',
    ],
    description: 'Array de URLs de imágenes para el carrusel',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageCarousel?: string[];

  @ApiProperty({
    example: 1,
    description: 'ID del tema seleccionado',
    required: false,
  })
  @IsInt()
  @IsOptional()
  themeId?: number;
}
