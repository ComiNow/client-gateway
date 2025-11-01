import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Supervisor',
    description: 'Nombre del rol',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Supervisor de turno con acceso a reportes',
    description: 'Descripción del rol',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: ['orders', 'reports', 'employees'],
    description: 'IDs de los módulos/permisos que tiene el rol',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}
