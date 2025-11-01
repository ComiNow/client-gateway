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
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom } from 'rxjs';
import { PaginationDto } from 'src/common';
import { NATS_SERVICE } from 'src/config';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { User } from 'src/auth/decorators';
import { SkipBusinessCheck } from 'src/auth/decorators/skip-business-check.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear producto',
    description: 'Crea un nuevo producto en el sistema.',
  })
  @ApiCreatedResponse({
    description: 'Producto creado exitosamente',
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT requerido' })
  createProduct(@Body() createProductDto: CreateProductDto, @User() user: any) {
    if (createProductDto.image && !Array.isArray(createProductDto.image)) {
      createProductDto.image = [createProductDto.image];
    }

    const payload = {
      ...createProductDto,
      businessId: user.businessId,
    };

    return this.client.send({ cmd: 'create_product' }, payload);
  }

  @Get()
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Listar productos',
    description:
      'Obtiene lista paginada de productos disponibles. Si no envía token JWT, debe proporcionar businessId como query param.',
  })
  @ApiQuery({
    name: 'businessId',
    required: false,
    type: String,
    description: 'ID del negocio (requerido si no se envía token JWT)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Lista de productos',
  })
  findAllProducts(@Query() paginationDto: PaginationDto, @User() user: any) {
    const businessId = user?.businessId || paginationDto.businessId || null;

    if (!businessId) {
      throw new BadRequestException(
        'businessId es requerido (token JWT o query param)',
      );
    }

    const payload = {
      ...paginationDto,
      businessId,
    };

    return this.client.send({ cmd: 'find_all_products' }, payload);
  }

  @Get('top-selling')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Productos más vendidos',
    description: 'Obtiene los productos con mayor cantidad de ventas.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de productos (por defecto 5)',
    example: 5,
  })
  @ApiQuery({
    name: 'businessId',
    required: false,
    type: String,
    description: 'ID del negocio (requerido si no se envía token JWT)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiOkResponse({
    description: 'Top productos vendidos',
  })
  async getTopSellingProducts(
    @User() user: any,
    @Query('limit') limit?: number,
    @Query('businessId') businessId?: string,
  ) {
    const finalBusinessId = user?.businessId || businessId || null;

    if (!finalBusinessId) {
      throw new BadRequestException(
        'businessId es requerido (token JWT o query param)',
      );
    }

    try {
      return await firstValueFrom(
        this.client.send(
          { cmd: 'find_top_selling_products' },
          {
            limit: Number(limit) || 5,
            businessId: finalBusinessId,
          },
        ),
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Get(':id')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Obtener producto por ID',
    description: 'Busca un producto específico por su identificador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del producto',
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
    description: 'Producto encontrado',
  })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  async findOne(
    @Param('id') id: string,
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
        { cmd: 'find_one_product' },
        { id: +id, businessId: finalBusinessId },
      )
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }

  @Patch(':id')
  @SkipBusinessCheck()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar producto',
    description: 'Actualiza parcialmente los datos de un producto.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del producto a actualizar',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Producto actualizado',
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT requerido' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  patchProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @User() user: any,
  ) {
    if (updateProductDto.image && !Array.isArray(updateProductDto.image)) {
      updateProductDto.image = [updateProductDto.image];
    }

    const { businessId: _, ...cleanDto } = updateProductDto as any;

    return this.client
      .send(
        { cmd: 'update_product' },
        {
          id,
          updateProductDto: { id, ...cleanDto },
          businessId: user.businessId,
        },
      )
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }

  @Delete(':id')
  @SkipBusinessCheck()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar producto',
    description: 'Elimina lógicamente un producto del sistema.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del producto a eliminar',
    example: '1',
  })
  @ApiOkResponse({
    description: 'Producto eliminado',
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT requerido' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado' })
  deleteProduct(@Param('id') id: string, @User() user: any) {
    return this.client
      .send({ cmd: 'delete_product' }, { id: +id, businessId: user.businessId })
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }
}
