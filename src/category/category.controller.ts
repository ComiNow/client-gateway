import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { catchError, lastValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { User } from 'src/auth/decorators';
import { SkipBusinessCheck } from 'src/auth/decorators/skip-business-check.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({
    summary: 'Crear categoría',
    description: 'Crea una nueva categoría con imágenes opcionales.',
  })
  @ApiConsumes('application/json', 'multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'firstImage', maxCount: 1 },
      { name: 'secondImage', maxCount: 1 },
    ]),
  )
  @ApiBody({
    description: 'Datos de la categoría',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nombre de la categoría',
          example: 'Bebidas Calientes',
        },
        firstImage: {
          oneOf: [
            { type: 'string', format: 'uri' },
            { type: 'string', format: 'binary' },
          ],
          description: 'Primera imagen (URL o archivo)',
        },
        secondImage: {
          oneOf: [
            { type: 'string', format: 'uri' },
            { type: 'string', format: 'binary' },
          ],
          description: 'Segunda imagen (URL o archivo)',
        },
      },
      required: ['name'],
    },
  })
  @ApiCreatedResponse({
    description: 'Categoría creada exitosamente',
    schema: {
      example: {
        id: 1,
        name: 'Bebidas Calientes',
        firstImage: 'https://storage.example.com/image1.jpg',
        available: true,
      },
    },
  })
  @ApiConflictResponse({
    description: 'Ya existe una categoría con ese nombre',
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT requerido' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @User() user: any,
    @UploadedFiles()
    files?: {
      firstImage?: Express.Multer.File[];
      secondImage?: Express.Multer.File[];
    },
  ) {
    const category: CreateCategoryDto = {
      ...createCategoryDto,
    };

    if (files) {
      if (files.firstImage && files.firstImage.length > 0) {
        const firstImageResult = await this.uploadCategoryImage(
          files.firstImage[0],
          'first',
        );
        category.firstImage = firstImageResult.fileName;
      }

      if (files.secondImage && files.secondImage.length > 0) {
        const secondImageResult = await this.uploadCategoryImage(
          files.secondImage[0],
          'second',
        );
        category.secondImage = secondImageResult.fileName;
      }
    }

    const payload = {
      ...category,
      businessId: user.businessId,
    };

    return this.client.send({ cmd: 'create_category' }, payload).pipe(
      catchError((err) => {
        throw new RpcException(err);
      }),
    );
  }

  @Get()
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Listar categorías',
    description:
      'Obtiene todas las categorías disponibles. Si no envía token JWT, debe proporcionar businessId como query param.',
  })
  @ApiQuery({
    name: 'businessId',
    required: false,
    type: String,
    description: 'ID del negocio (requerido si no se envía token JWT)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Lista de categorías',
    schema: {
      example: [
        {
          id: 1,
          name: 'Bebidas Calientes',
          firstImage: 'https://storage.example.com/image1.jpg',
          available: true,
          productsCount: 15,
        },
      ],
    },
  })
  findAll(@User() user: any, @Query('businessId') businessId?: string) {
    const finalBusinessId = user?.businessId || businessId || null;

    if (!finalBusinessId) {
      throw new BadRequestException(
        'businessId es requerido (token JWT o query param)',
      );
    }

    return this.client
      .send({ cmd: 'find_all_categories' }, { businessId: finalBusinessId })
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }

  @Get(':id')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Obtener categoría por ID',
    description: 'Busca una categoría específica por su identificador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la categoría',
    example: '1',
  })
  @ApiQuery({
    name: 'businessId',
    required: false,
    type: String,
    description: 'ID del negocio (requerido si no se envía token JWT)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Categoría encontrada',
    schema: {
      example: {
        id: 1,
        name: 'Bebidas Calientes',
        firstImage: 'https://storage.example.com/image1.jpg',
        available: true,
        products: [],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @User() user: any,
    @Query('businessId') businessId?: string,
  ) {
    const finalBusinessId = user?.businessId || businessId || null;

    if (!finalBusinessId) {
      throw new BadRequestException(
        'businessId es requerido (token JWT o query param)',
      );
    }

    return this.client
      .send(
        { cmd: 'find_one_category' },
        { id: +id, businessId: finalBusinessId },
      )
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiUnauthorizedResponse({
    description: 'Token JWT requerido',
  })
  @Patch(':id')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Actualizar categoría',
    description: 'Actualiza los datos de una categoría existente.',
  })
  @ApiConsumes('application/json', 'multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'firstImage', maxCount: 1 },
      { name: 'secondImage', maxCount: 1 },
    ]),
  )
  @ApiParam({
    name: 'id',
    description: 'ID de la categoría',
    example: 1,
  })
  @ApiBody({
    description: 'Campos a actualizar',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nuevo nombre de la categoría',
        },
        firstImage: {
          oneOf: [
            { type: 'string', format: 'uri' },
            { type: 'string', format: 'binary' },
          ],
          description:
            'URL de imagen existente o archivo para cargar nueva imagen',
        },
        secondImage: {
          oneOf: [
            { type: 'string', format: 'uri' },
            { type: 'string', format: 'binary' },
          ],
          description:
            'URL de imagen existente o archivo para cargar nueva imagen',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Categoría actualizada',
    schema: {
      example: {
        id: 1,
        name: 'Bebidas Premium',
        available: true,
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  @ApiConflictResponse({
    description: 'Ya existe una categoría con ese nombre',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @User() user: any,
    @UploadedFiles()
    files?: {
      firstImage?: Express.Multer.File[];
      secondImage?: Express.Multer.File[];
    },
  ) {
    const category: UpdateCategoryDto = {
      ...updateCategoryDto,
    };

    if (files) {
      if (files.firstImage && files.firstImage.length > 0) {
        const firstImageResult = await this.uploadCategoryImage(
          files.firstImage[0],
          'first',
        );
        category.firstImage = firstImageResult.fileName;
      }

      if (files.secondImage && files.secondImage.length > 0) {
        const secondImageResult = await this.uploadCategoryImage(
          files.secondImage[0],
          'second',
        );
        category.secondImage = secondImageResult.fileName;
      }
    }

    return this.client
      .send(
        { cmd: 'update_category' },
        {
          id,
          updateCategoryDto: { id, ...category },
          businessId: user.businessId,
        },
      )
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiUnauthorizedResponse({
    description: 'Token JWT requerido',
  })
  @Delete(':id')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Eliminar categoría',
    description: 'Realiza borrado lógico de la categoría.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la categoría',
    example: '1',
  })
  @ApiOkResponse({
    description: 'Categoría eliminada',
    schema: {
      example: {
        id: 1,
        available: false,
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  remove(@Param('id') id: string, @User() user: any) {
    return this.client
      .send(
        { cmd: 'delete_category' },
        { id: +id, businessId: user.businessId },
      )
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }

  @ApiBearerAuth('JWT-auth')
  @Get('admin/all')
  @ApiOperation({
    summary: 'Listar todas las categorías (Admin)',
    description: 'Obtiene todas las categorías incluyendo eliminadas.',
  })
  @ApiOkResponse({
    description: 'Lista completa de categorías',
    schema: {
      example: [
        {
          id: 1,
          name: 'Bebidas Calientes',
          available: true,
        },
        {
          id: 2,
          name: 'Categoría Eliminada',
          available: false,
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Solo administradores' })
  findAllIncludingDeleted(@User() user: any) {
    return this.client
      .send(
        { cmd: 'find_all_categories_including_deleted' },
        { businessId: user.businessId },
      )
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }

  @ApiBearerAuth('JWT-auth')
  @Put(':id/restore')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Restaurar categoría (Admin)',
    description: 'Restaura una categoría previamente eliminada.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la categoría',
    example: '1',
  })
  @ApiOkResponse({
    description: 'Categoría restaurada',
    schema: {
      example: {
        id: 1,
        available: true,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Solo administradores' })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  restore(@Param('id') id: string, @User() user: any) {
    return this.client
      .send(
        { cmd: 'restore_category' },
        { id: +id, businessId: user.businessId },
      )
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }

  private async uploadCategoryImage(
    file: Express.Multer.File,
    type: 'first' | 'second',
  ) {
    const serializedFile = {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer.toString('base64'),
    };

    return await lastValueFrom(
      this.client
        .send(
          { cmd: 'upload_category_image' },
          {
            file: serializedFile,
            type,
          },
        )
        .pipe(
          catchError((error) => {
            throw new RpcException({
              message: `Error uploading image: ${error.message}`,
              status: 500,
            });
          }),
        ),
    );
  }
}
