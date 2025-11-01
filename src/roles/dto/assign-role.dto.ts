import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    example: '68dded65a50dd17af9ce9b08',
    description: 'ID del empleado',
  })
  @IsString()
  employeeId: string;

  @ApiProperty({
    example: '68dded65a50dd17af9ce9b09',
    description: 'ID del rol a asignar (un solo rol)',
  })
  @IsString()
  roleId: string;
}
