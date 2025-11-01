import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'kevin@udea.edu.co.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'EjemploPass4325*' })
  @IsString()
  password: string;
}
