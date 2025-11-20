import { Body, Controller, Get, Inject, Post, Param } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { User, Token } from './decorators';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiParam,
} from '@nestjs/swagger';
import { envs } from 'src/config/envs';
import { LoginUserDto, RegisterUserDto, RegisterBusinessDto } from './dto';
import { catchError } from 'rxjs';
import { SkipBusinessCheck } from './decorators/skip-business-check.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(envs.natsServiceName) private readonly client: ClientProxy,
  ) {}

  @Post('register/business')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Registrar nuevo negocio',
    description:
      'Registra un nuevo negocio con su administrador y ubicación inicial.',
  })
  @ApiBody({
    type: RegisterBusinessDto,
    examples: {
      example1: {
        summary: 'Cafetería',
        value: {
          businessName: 'Café Central',
          businessEmail: 'contacto@cafecentral.com',
          businessPhone: '3001234567',
          businessIdentificationNumber: '900123456',
          businessIdentificationType: 'CC',
          adminFullName: 'Juan Pérez',
          adminEmail: 'admin@cafecentral.com',
          adminPhone: '3007654321',
          adminIdentificationNumber: '1234567890',
          adminPassword: 'SecurePass123!',
          locationState: 'Cundinamarca',
          locationCity: 'Bogotá',
          locationPostalCode: '110111',
          locationAddress: 'Calle 123 #45-67',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Negocio registrado exitosamente',
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @ApiConflictResponse({ description: 'Negocio ya existe' })
  registerBusiness(@Body() registerBusinessDto: RegisterBusinessDto) {
    return this.client.send('auth.register.business', registerBusinessDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('register/employee')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Registrar nuevo empleado',
    description:
      'Registra un empleado en el negocio. Solo puede ser realizado por un administrador.',
  })
  @ApiBody({
    type: RegisterUserDto,
    examples: {
      example1: {
        summary: 'Empleado de cocina',
        value: {
          fullName: 'María González',
          identificationNumber: '1234567890',
          email: 'maria@coffeenow.com',
          roleId: '691e5fc362e1b40d467b7f6c',
          password: 'SecurePass123!',
          businessId: '507f1f77bcf86cd799439012',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Empleado registrado exitosamente',
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @ApiConflictResponse({ description: 'Empleado ya existe' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  registerEmployee(@Body() registerUserDto: RegisterUserDto) {
    return this.client.send('auth.register.employee', registerUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('login')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica credenciales y devuelve token JWT.',
  })
  @ApiBody({
    type: LoginUserDto,
    examples: {
      example1: {
        summary: 'Login básico',
        value: {
          identificationNumber: '12345678',
          password: 'SecurePass123!',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Login exitoso',
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales incorrectas' })
  @ApiBadRequestResponse({ description: 'Datos requeridos faltantes' })
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.client.send('auth.login.user', loginUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('verify')
  @SkipBusinessCheck()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Verificar token',
    description:
      'Valida token JWT y devuelve información del usuario actualizada.',
  })
  @ApiOkResponse({
    description: 'Token válido',
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado' })
  async verifyToken(@User() user: any, @Token() token: string) {
    return { user, token };
  }

  @Get('modules')
  @SkipBusinessCheck()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener módulos del sistema',
    description: 'Lista módulos disponibles según permisos del usuario.',
  })
  @ApiOkResponse({
    description: 'Módulos obtenidos',
  })
  @ApiUnauthorizedResponse({ description: 'Token requerido' })
  getAllModules() {
    return this.client.send('auth.get.modules', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('business/:businessId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener información del negocio',
    description: 'Obtiene la información completa de un negocio por su ID.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio (MongoDB ObjectId)',
    example: '68dded65a50dd17af9ce9b08',
  })
  @ApiOkResponse({
    description: 'Información del negocio obtenida',
  })
  @ApiUnauthorizedResponse({ description: 'Token requerido' })
  getBusinessById(@Param('businessId') businessId: string) {
    return this.client.send('auth.get.business', businessId).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('employees/business/:businessId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener empleados de un negocio',
    description: 'Lista todos los empleados pertenecientes a un negocio.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio (MongoDB ObjectId)',
    example: '68dded65a50dd17af9ce9b08',
  })
  @ApiOkResponse({
    description: 'Lista de empleados obtenida',
  })
  @ApiUnauthorizedResponse({ description: 'Token requerido' })
  getEmployeesByBusinessId(@Param('businessId') businessId: string) {
    return this.client.send('auth.get.employees.by.business', businessId).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('modules/seed')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Inicializar módulos del sistema',
    description:
      'Crea los módulos base del sistema. Solo se ejecuta una vez, si ya existen módulos no hace nada.',
  })
  @ApiCreatedResponse({
    description: 'Módulos inicializados',
    schema: {
      example: {
        message: 'Modules initialized successfully',
        count: 9,
      },
    },
  })
  seedModules() {
    return this.client.send('auth.seed.modules', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
