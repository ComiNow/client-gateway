import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Logger,
  BadRequestException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, lastValueFrom, timeout } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { User } from 'src/auth/decorators';

@Controller('customization/files')
export class CustomizationFilesController {
  private readonly logger = new Logger(CustomizationFilesController.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
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
            { cmd: 'upload_customization_logo' },
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
      this.logger.error(`Error al subir logo: ${error.message}`);
      throw new InternalServerErrorException('Error uploading logo');
    }
  }

  @Post('carousel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCarouselImage(
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
            { cmd: 'upload_customization_carousel' },
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
      this.logger.error(`Error al subir imagen de carrusel: ${error.message}`);
      throw new InternalServerErrorException('Error uploading carousel image');
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
