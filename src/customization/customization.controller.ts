import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { catchError } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { User } from 'src/auth/decorators';
import { CreateUIConfigurationDto } from './dto/create-ui-configuration.dto';
import { UpdateUIConfigurationDto } from './dto/update-ui-configuration.dto';
import { SkipBusinessCheck } from 'src/auth/decorators/skip-business-check.decorator';

@ApiTags('Customization - UI Configuration')
@ApiBearerAuth('JWT-auth')
@Controller('customization')
export class CustomizationController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post()
  @ApiOperation({
    summary: 'Crear configuración de UI',
    description:
      'Crea la configuración de interfaz de usuario para un negocio, incluyendo nombre comercial (brand), logo, tema, fuentes y carrusel de imágenes.',
  })
  @ApiBody({
    type: CreateUIConfigurationDto,
    examples: {
      example1: {
        summary: 'Configuración completa',
        value: {
          brand: 'Café Central - El mejor café de la ciudad',
          logo: 'https://res.cloudinary.com/xxx/logo.png',
          font: 'Poppins',
          fontSize: 16,
          imageCarousel: [
            'https://res.cloudinary.com/xxx/image1.jpg',
            'https://res.cloudinary.com/xxx/image2.jpg',
          ],
          themeId: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Configuración creada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe configuración para este negocio',
  })
  create(@Body() createDto: CreateUIConfigurationDto, @User() user: any) {
    const payload = {
      ...createDto,
      businessId: user.businessId,
    };

    return this.client.send({ cmd: 'create_ui_configuration' }, payload).pipe(
      catchError((err) => {
        throw new RpcException(err);
      }),
    );
  }

  @Get(':businessId')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Obtener configuración de UI por negocio',
    description:
      'Obtiene la configuración de interfaz completa de un negocio, incluyendo el nombre comercial (brand) y todos los elementos visuales.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio (MongoDB ObjectId)',
    example: '68dded65a50dd17af9ce9b08',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración obtenida exitosamente',
    schema: {
      example: {
        id: 1,
        businessId: '68dded65a50dd17af9ce9b08',
        brand: 'Café Central - El mejor café de la ciudad',
        logo: 'https://res.cloudinary.com/xxx/logo.png',
        font: 'Poppins',
        fontSize: 16,
        imageCarousel: [
          'https://res.cloudinary.com/xxx/image1.jpg',
          'https://res.cloudinary.com/xxx/image2.jpg',
        ],
        themeId: 1,
        theme: {
          id: 1,
          name: 'light',
        },
        createdAt: '2025-10-27T10:00:00Z',
        updatedAt: '2025-10-27T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración no encontrada',
  })
  findByBusiness(@Param('businessId') businessId: string, @User() user: any) {
    const finalBusinessId = user?.businessId || businessId;

    if (!finalBusinessId) {
      throw new BadRequestException('businessId es requerido');
    }

    return this.client
      .send(
        { cmd: 'find_ui_configuration_by_business' },
        { businessId: finalBusinessId },
      )
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }

  @Patch()
  @ApiOperation({
    summary: 'Actualizar configuración de UI',
    description:
      'Actualiza parcialmente la configuración de interfaz, incluyendo el nombre comercial (brand) u otros elementos visuales.',
  })
  @ApiBody({
    type: UpdateUIConfigurationDto,
    examples: {
      example1: {
        summary: 'Actualizar solo el nombre comercial',
        value: {
          brand: 'Café Central - Ahora con más sabor',
        },
      },
      example2: {
        summary: 'Actualizar múltiples campos',
        value: {
          brand: 'Café Central Premium',
          logo: 'https://res.cloudinary.com/xxx/new-logo.png',
          fontSize: 18,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración no encontrada',
  })
  update(@Body() updateDto: UpdateUIConfigurationDto, @User() user: any) {
    return this.client
      .send(
        { cmd: 'update_ui_configuration' },
        { businessId: user.businessId, updateDto },
      )
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }

  @Delete()
  @ApiOperation({
    summary: 'Eliminar configuración de UI',
    description: 'Elimina la configuración de interfaz del negocio.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración no encontrada',
  })
  remove(@User() user: any) {
    return this.client
      .send({ cmd: 'delete_ui_configuration' }, { businessId: user.businessId })
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }
}
