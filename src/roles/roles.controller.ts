import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { catchError } from 'rxjs';
import { envs } from 'src/config/envs';
import { User } from 'src/auth/decorators';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
export class RolesController {
  constructor(
    @Inject(envs.natsServiceName) private readonly client: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo rol',
    description:
      'Crea un rol personalizado para el negocio con permisos específicos. El rol puede tener múltiples permisos pero cada empleado solo tendrá un rol.',
  })
  @ApiBody({
    type: CreateRoleDto,
    examples: {
      example1: {
        summary: 'Rol de Supervisor',
        value: {
          name: 'Supervisor',
          description: 'Supervisor de turno con acceso a reportes y personal',
          permissions: ['orders', 'reports', 'employees'],
        },
      },
      example2: {
        summary: 'Rol de Barista',
        value: {
          name: 'Barista',
          description: 'Especialista en preparación de bebidas',
          permissions: ['orders', 'products'],
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Rol creado exitosamente',
    schema: {
      example: {
        id: '68dded65a50dd17af9ce9b08',
        name: 'Supervisor',
        description: 'Supervisor de turno con acceso a reportes y personal',
        permissions: ['orders', 'reports', 'employees'],
        isDefault: false,
        isSystem: false,
        businessId: '68dded65a50dd17af9ce9b09',
        createdAt: '2025-10-28T10:00:00Z',
        updatedAt: '2025-10-28T10:00:00Z',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @ApiConflictResponse({ description: 'Ya existe un rol con ese nombre' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  create(@Body() createRoleDto: CreateRoleDto, @User() user: any) {
    return this.client
      .send('roles.create', {
        ...createRoleDto,
        businessId: user.businessId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Get('business/:businessId')
  @ApiOperation({
    summary: 'Listar roles del negocio',
    description:
      'Obtiene todos los roles (predeterminados y personalizados) de un negocio con el conteo de empleados asignados.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio',
    example: '68dded65a50dd17af9ce9b08',
  })
  @ApiOkResponse({
    description: 'Lista de roles obtenida',
    schema: {
      example: [
        {
          id: '68dded65a50dd17af9ce9b08',
          name: 'Administrador',
          description: 'Acceso completo a todos los módulos del sistema',
          permissions: ['orders', 'products', 'reports', 'employees'],
          isDefault: true,
          isSystem: true,
          employeeCount: 2,
          businessId: '68dded65a50dd17af9ce9b09',
          createdAt: '2025-10-27T10:00:00Z',
          updatedAt: '2025-10-27T10:00:00Z',
        },
        {
          id: '68dded65a50dd17af9ce9b10',
          name: 'Cajero',
          description: 'Acceso al punto de venta y gestión de órdenes',
          permissions: ['orders', 'payments'],
          isDefault: true,
          isSystem: false,
          employeeCount: 5,
          businessId: '68dded65a50dd17af9ce9b09',
          createdAt: '2025-10-27T10:00:00Z',
          updatedAt: '2025-10-27T10:00:00Z',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  findAll(@Param('businessId') businessId: string) {
    return this.client.send('roles.findAll', businessId).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener rol por ID',
    description:
      'Obtiene la información detallada de un rol específico incluyendo los módulos/permisos y el conteo de empleados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del rol',
    example: '68dded65a50dd17af9ce9b08',
  })
  @ApiOkResponse({
    description: 'Rol encontrado',
    schema: {
      example: {
        id: '68dded65a50dd17af9ce9b08',
        name: 'Cajero',
        description: 'Acceso al punto de venta y gestión de órdenes',
        permissions: ['orders', 'payments'],
        isDefault: true,
        isSystem: false,
        businessId: '68dded65a50dd17af9ce9b09',
        employeeCount: 5,
        modules: [
          {
            id: 'orders',
            name: 'orders',
            displayName: 'Gestión de Órdenes',
            description: 'Módulo para gestionar pedidos',
            icon: '🛒',
            order: 1,
            isActive: true,
          },
          {
            id: 'payments',
            name: 'payments',
            displayName: 'Pagos',
            description: 'Módulo de procesamiento de pagos',
            icon: '💳',
            order: 2,
            isActive: true,
          },
        ],
        createdAt: '2025-10-27T10:00:00Z',
        updatedAt: '2025-10-27T10:00:00Z',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  findOne(@Param('id') id: string, @User() user: any) {
    return this.client
      .send('roles.findOne', { roleId: id, businessId: user.businessId })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar rol',
    description:
      'Actualiza nombre, descripción o permisos de un rol. Los roles del sistema (isSystem: true) no pueden ser modificados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del rol',
    example: '68dded65a50dd17af9ce9b08',
  })
  @ApiBody({
    type: UpdateRoleDto,
    examples: {
      example1: {
        summary: 'Actualizar permisos',
        value: {
          description: 'Supervisor con acceso ampliado',
          permissions: ['orders', 'reports', 'employees', 'inventory'],
        },
      },
      example2: {
        summary: 'Cambiar nombre y descripción',
        value: {
          name: 'Supervisor Senior',
          description: 'Supervisor con responsabilidades adicionales',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Rol actualizado exitosamente',
    schema: {
      example: {
        id: '68dded65a50dd17af9ce9b08',
        name: 'Supervisor Senior',
        description: 'Supervisor con responsabilidades adicionales',
        permissions: ['orders', 'reports', 'employees', 'inventory'],
        isDefault: false,
        isSystem: false,
        businessId: '68dded65a50dd17af9ce9b09',
        createdAt: '2025-10-27T10:00:00Z',
        updatedAt: '2025-10-28T11:30:00Z',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  @ApiConflictResponse({
    description: 'No se puede modificar un rol del sistema',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @User() user: any,
  ) {
    return this.client
      .send('roles.update', {
        roleId: id,
        updateRoleDto,
        businessId: user.businessId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar rol',
    description:
      'Elimina un rol personalizado. No se pueden eliminar roles del sistema (isSystem: true) ni roles asignados a empleados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del rol',
    example: '68dded65a50dd17af9ce9b08',
  })
  @ApiOkResponse({
    description: 'Rol eliminado exitosamente',
    schema: {
      example: {
        message: 'Rol eliminado correctamente',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  @ApiForbiddenResponse({
    description: 'No se puede eliminar un rol del sistema',
  })
  @ApiConflictResponse({
    description: 'No se puede eliminar: rol asignado a empleados',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  remove(@Param('id') id: string, @User() user: any) {
    return this.client
      .send('roles.remove', { roleId: id, businessId: user.businessId })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Post('assign')
  @ApiOperation({
    summary: 'Asignar rol a empleado',
    description:
      'Asigna UN rol a un empleado. El empleado solo puede tener un rol a la vez, pero ese rol puede tener múltiples permisos. Reemplaza el rol anterior si existía.',
  })
  @ApiBody({
    type: AssignRoleDto,
    examples: {
      example1: {
        summary: 'Asignar rol de Cajero',
        value: {
          employeeId: '68dded65a50dd17af9ce9b08',
          roleId: '68dded65a50dd17af9ce9b09',
        },
      },
      example2: {
        summary: 'Cambiar a Supervisor',
        value: {
          employeeId: '68dded65a50dd17af9ce9b08',
          roleId: '68dded65a50dd17af9ce9b10',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Rol asignado exitosamente',
    schema: {
      example: {
        id: '68dded65a50dd17af9ce9b08',
        identificationNumber: '1234567890',
        email: 'juan@example.com',
        fullName: 'Juan Pérez',
        businessId: '68dded65a50dd17af9ce9b09',
        roleId: '68dded65a50dd17af9ce9b10',
        role: {
          id: '68dded65a50dd17af9ce9b10',
          name: 'Cajero',
          description: 'Acceso al punto de venta',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @ApiNotFoundResponse({ description: 'Empleado o rol no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  assignRole(@Body() assignRoleDto: AssignRoleDto, @User() user: any) {
    return this.client
      .send('roles.assign', {
        ...assignRoleDto,
        businessId: user.businessId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
