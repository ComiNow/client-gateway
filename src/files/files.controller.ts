import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Logger,
  BadRequestException,
  Inject,
  InternalServerErrorException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, lastValueFrom, timeout } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { User } from 'src/auth/decorators';

@ApiTags('Files')
@ApiBearerAuth('JWT-auth')
@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('product')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir imagen de producto',
    description:
      'Sube una imagen para un producto al sistema de almacenamiento.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo de imagen',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (JPG, PNG, WEBP - máx 5MB)',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Imagen subida exitosamente',
    schema: {
      example: {
        fileName: 'https://storage.example.com/products/image-123.jpg',
        originalName: 'producto.jpg',
        size: 1024000,
      },
    },
  })
  @ApiBadRequestResponse({ description: 'No se subió ningún archivo' })
  @ApiInternalServerErrorResponse({
    description: 'Error al procesar el archivo',
  })
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @User() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const serializedFile = this.serializeFile(file);

      const result = await lastValueFrom(
        this.client
          .send(
            { cmd: 'upload_product_image' },
            { ...serializedFile, businessId: user.businessId },
          )
          .pipe(
            timeout(30000),
            catchError((error) => {
              this.logger.error(`Error en microservicio: ${error.message}`);
              throw new InternalServerErrorException(
                'Error processing file upload',
              );
            }),
          ),
      );

      return result;
    } catch (error) {
      this.logger.error(`Error al subir archivo: ${error.message}`);
      throw new InternalServerErrorException('Error uploading file');
    }
  }

  @Post('category/:type')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir imagen de categoría',
    description:
      'Sube una imagen para una categoría (primera o segunda imagen).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'type',
    description: 'Tipo de imagen de categoría',
    example: 'first',
    enum: ['first', 'second'],
  })
  @ApiBody({
    description: 'Archivo de imagen',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (JPG, PNG, WEBP - máx 5MB)',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Imagen de categoría subida exitosamente',
    schema: {
      example: {
        fileName: 'https://storage.example.com/categories/first-image-123.jpg',
        originalName: 'categoria.jpg',
        type: 'first',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Archivo o tipo inválido' })
  @ApiInternalServerErrorResponse({
    description: 'Error al procesar el archivo',
  })
  async uploadCategoryImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('type') type: string,
    @User() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (type !== 'first' && type !== 'second') {
      throw new BadRequestException('Type must be "first" or "second"');
    }

    try {
      const serializedFile = this.serializeFile(file);

      const result = await lastValueFrom(
        this.client
          .send(
            { cmd: 'upload_category_image' },
            {
              file: serializedFile,
              type,
              businessId: user.businessId,
            },
          )
          .pipe(
            timeout(30000),
            catchError((error) => {
              this.logger.error(`Error en microservicio: ${error.message}`);
              throw new InternalServerErrorException(
                'Error processing file upload',
              );
            }),
          ),
      );

      return result;
    } catch (error) {
      this.logger.error(`Error al subir archivo: ${error.message}`);
      throw new InternalServerErrorException('Error uploading file');
    }
  }

  private serializeFile(file: Express.Multer.File) {
    return {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer.toString('base64'),
    };
  }
}
