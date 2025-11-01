import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'María González' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  identificationNumber: string;

  @ApiProperty({ example: 'maria@coffeenow.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '68dded65a50dd17af9ce9b08',
    description: 'ID del rol a asignar al empleado (un solo rol)',
  })
  @IsString()
  roleId: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsString()
  businessId: string;
}
