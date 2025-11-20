import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
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
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { SkipBusinessCheck } from 'src/auth/decorators/skip-business-check.decorator';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('roles')
export class RolesController {
  constructor(
    @Inject(envs.natsServiceName) private readonly client: ClientProxy,
  ) {}

  @Post()
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Crear nuevo rol',
    description:
      'Crea un rol personalizado para el negocio con permisos específicos. Los permisos deben ser IDs de módulos válidos.',
  })
  @ApiBody({
    type: CreateRoleDto,
    examples: {
      example1: {
        summary: 'Rol de Supervisor',
        value: {
          name: 'Supervisor',
          description: 'Supervisor de turno con acceso a reportes y personal',
          permissions: [
            '673abc123def456789012345',
            '673abc123def456789012346',
            '673abc123def456789012347',
          ],
        },
      },
      example2: {
        summary: 'Rol de Barista',
        value: {
          name: 'Barista',
          description: 'Especialista en preparación de bebidas',
          permissions: ['673abc123def456789012345', '673abc123def456789012348'],
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Rol creado exitosamente' })
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

  @Post('defaults/:businessId')
  @ApiOperation({
    summary: 'Crear roles por defecto',
    description:
      'Crea los roles predeterminados del sistema para un negocio (Administrador, Gerente, Cajero, Cocinero, Mesero). Este endpoint normalmente se llama automáticamente al crear un negocio.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio',
    example: '673abc123def456789012345',
  })
  @ApiCreatedResponse({ description: 'Roles por defecto creados' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  createDefaultRoles(@Param('businessId') businessId: string) {
    return this.client.send('roles.createDefaults', { businessId }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get()
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Listar roles del negocio',
    description:
      'Obtiene todos los roles (predeterminados y personalizados) del negocio autenticado con el conteo de empleados asignados.',
  })
  @ApiOkResponse({ description: 'Lista de roles obtenida' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  findAll(@User() user: any) {
    return this.client.send('roles.findAll', user.businessId).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get(':id')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Obtener rol por ID',
    description:
      'Obtiene la información detallada de un rol específico incluyendo los módulos/permisos y el conteo de empleados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del rol',
    example: '673abc123def456789012345',
  })
  @ApiOkResponse({ description: 'Rol encontrado' })
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
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Actualizar rol',
    description:
      'Actualiza nombre, descripción o permisos de un rol. Los roles del sistema (isSystem: true) no pueden ser modificados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del rol',
    example: '673abc123def456789012345',
  })
  @ApiBody({ type: UpdateRoleDto })
  @ApiOkResponse({ description: 'Rol actualizado exitosamente' })
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
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Eliminar rol',
    description:
      'Elimina un rol personalizado. No se pueden eliminar roles del sistema (isSystem: true) ni roles asignados a empleados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del rol',
    example: '673abc123def456789012345',
  })
  @ApiOkResponse({ description: 'Rol eliminado exitosamente' })
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
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Asignar rol a empleado',
    description:
      'Asigna UN rol a un empleado. El empleado solo puede tener un rol a la vez.',
  })
  @ApiBody({ type: AssignRoleDto })
  @ApiOkResponse({ description: 'Rol asignado exitosamente' })
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
