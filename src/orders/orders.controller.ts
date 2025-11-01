import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Inject,
  ParseUUIDPipe,
  ParseIntPipe,
  Query,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { CreateOrderDto, OrderPaginationDto } from './dto';
import { envs } from 'src/config/envs';
import { PaginationDto } from 'src/common';
import { firstValueFrom } from 'rxjs';
import { StatusDto } from './dto/status.dto';
import { User } from 'src/auth/decorators';
import { SkipBusinessCheck } from 'src/auth/decorators/skip-business-check.decorator';

@ApiBearerAuth('JWT-auth')
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(envs.natsServiceName) private readonly client: ClientProxy,
  ) {}

  @Post()
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Crear pedido',
    description:
      'Crea un nuevo pedido en el sistema. Endpoint público para clientes sin autenticación. El businessId debe ser enviado en el body.',
  })
  @ApiCreatedResponse({
    description: 'Pedido creado exitosamente',
    schema: {
      example: {
        order: {
          id: 1,
          businessId: '68dde84e273d5c7953420e9d',
          tableId: '9128352e-386c-46fd-beb4-78c6827de348',
          status: 'PENDING',
          totalAmount: 15000,
          totalItems: 2,
        },
        paymentPreference: {
          id: 'pref_123456',
          init_point:
            'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref_123456',
        },
      },
    },
  })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.client.send('createOrder', createOrderDto);
  }

  @Post('pos')
  @ApiOperation({
    summary: 'Crear pedido desde POS',
    description:
      'Crea pedido con estado específico desde punto de venta. Requiere autenticación. El businessId se toma del token del usuario.',
  })
  @ApiCreatedResponse({
    description: 'Pedido POS creado',
    schema: {
      example: {
        id: 1,
        businessId: '68dde84e273d5c7953420e9d',
        tableId: '9128352e-386c-46fd-beb4-78c6827de348',
        status: 'PAID',
        totalAmount: 15000,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT requerido' })
  createOrderFromPos(
    @Body() createOrderDto: CreateOrderDto,
    @User() user: any,
  ) {
    const payload = {
      ...createOrderDto,
      businessId: user.businessId,
    };
    return this.client.send('createOrderWithStatus', payload);
  }

  @Get(':businessId')
  @ApiOperation({
    summary: 'Listar pedidos',
    description: 'Obtiene lista paginada de pedidos con filtros opcionales.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio (MongoDB ObjectId)',
    example: '68dde84e273d5c7953420e9d',
  })
  @ApiOkResponse({
    description: 'Lista de pedidos',
    schema: {
      example: {
        data: [
          {
            id: 1,
            businessId: '68dde84e273d5c7953420e9d',
            tableId: '9128352e-386c-46fd-beb4-78c6827de348',
            status: 'PENDING',
            totalAmount: 15000,
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          lastPage: 1,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT requerido' })
  async findAllByBusinessId(
    @Query() orderPaginationDto: OrderPaginationDto,
    @Param('businessId') businessId: string,
  ) {
    try {
      const orders = await firstValueFrom(
        this.client.send('findAllOrders', { orderPaginationDto, businessId }),
      );
      return orders;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Get('kitchen/:businessId')
  @ApiOperation({
    summary: 'Pedidos de cocina',
    description: 'Obtiene pedidos pendientes para la cocina.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio (MongoDB ObjectId)',
    example: '68dde84e273d5c7953420e9d',
  })
  @ApiOkResponse({
    description: 'Pedidos de cocina',
    schema: {
      example: {
        data: [
          {
            id: 1,
            businessId: '68dde84e273d5c7953420e9d',
            tableId: '9128352e-386c-46fd-beb4-78c6827de348',
            status: 'PREPARING',
            items: [
              {
                productId: 1,
                productName: 'Café Americano',
                quantity: 2,
              },
            ],
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT requerido' })
  async getKitchenOrders(
    @Query() paginationDto: PaginationDto,
    @Param('businessId') businessId: string,
  ) {
    try {
      const orders = await firstValueFrom(
        this.client.send('findKitchenOrders', { paginationDto, businessId }),
      );
      return orders;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Get(':businessId/:id')
  @ApiOperation({
    summary: 'Obtener pedido por ID',
    description: 'Busca un pedido específico por su identificador.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio (MongoDB ObjectId)',
    example: '68dde84e273d5c7953420e9d',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del pedido',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Pedido encontrado',
    schema: {
      example: {
        id: 1,
        businessId: '68dde84e273d5c7953420e9d',
        tableId: '9128352e-386c-46fd-beb4-78c6827de348',
        status: 'PENDING',
        totalAmount: 15000,
        items: [
          {
            productId: 1,
            productName: 'Café Americano',
            quantity: 2,
            price: 3500,
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT requerido' })
  @ApiNotFoundResponse({ description: 'Pedido no encontrado' })
  async findOne(
    @Param('businessId') businessId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const order = await firstValueFrom(
        this.client.send('findOneOrder', { id, businessId }),
      );
      return order;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Get(':businessId/paid-order-by-table/:tableId')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Buscar pedido pagado por mesa',
    description:
      'Obtiene el pedido pagado asociado a una mesa específica. Endpoint público para clientes.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio (MongoDB ObjectId)',
    example: '68dde84e273d5c7953420e9d',
  })
  @ApiParam({
    name: 'tableId',
    description: 'ID de la mesa (UUID)',
    example: '9128352e-386c-46fd-beb4-78c6827de348',
  })
  @ApiOkResponse({
    description: 'Pedido pagado encontrado',
    schema: {
      example: {
        id: 1,
        businessId: '68dde84e273d5c7953420e9d',
        tableId: '9128352e-386c-46fd-beb4-78c6827de348',
        status: 'PAID',
        totalAmount: 15000,
      },
    },
  })
  async findPaidOrderByTableId(
    @Param('businessId') businessId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
  ) {
    try {
      const order = await firstValueFrom(
        this.client.send('findPaidOrderByTableId', { tableId, businessId }),
      );
      return order;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Get(':businessId/order-position-by-table/:tableId')
  @SkipBusinessCheck()
  @ApiOperation({
    summary: 'Posición en cola por mesa',
    description:
      'Obtiene la posición del pedido en la cola de cocina por mesa. Endpoint público para clientes.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio (MongoDB ObjectId)',
    example: '68dde84e273d5c7953420e9d',
  })
  @ApiParam({
    name: 'tableId',
    description: 'ID de la mesa (UUID)',
    example: '9128352e-386c-46fd-beb4-78c6827de348',
  })
  @ApiOkResponse({
    description: 'Posición en cola',
    schema: {
      example: {
        orderPosition: 3,
      },
    },
  })
  async findOrderPositionByTableId(
    @Param('businessId') businessId: string,
    @Param('tableId', ParseUUIDPipe) tableId: string,
  ) {
    try {
      const orderPosition = await firstValueFrom(
        this.client.send('getOrderPositionByTableId', { tableId, businessId }),
      );
      return { orderPosition };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Patch(':businessId/order/:id')
  @ApiOperation({
    summary: 'Cambiar estado del pedido',
    description: 'Actualiza el estado de un pedido específico.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio (MongoDB ObjectId)',
    example: '68dde84e273d5c7953420e9d',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del pedido',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Estado del pedido actualizado',
    schema: {
      example: {
        id: 1,
        status: 'PREPARING',
        updatedAt: '2024-01-15T11:00:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT requerido' })
  @ApiNotFoundResponse({ description: 'Pedido no encontrado' })
  changeOrderStatus(
    @Param('businessId') businessId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: StatusDto,
  ) {
    return this.client.send('changeOrderStatus', {
      businessId,
      id,
      status: body.status,
    });
  }

  @Patch(':businessId/order/:id/delivered')
  @ApiOperation({
    summary: 'Marcar pedido como entregado',
    description: 'Marca un pedido como entregado al cliente.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio (MongoDB ObjectId)',
    example: '68dde84e273d5c7953420e9d',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del pedido',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Pedido marcado como entregado',
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT requerido' })
  @ApiNotFoundResponse({ description: 'Pedido no encontrado' })
  async markOrderAsDelivered(
    @Param('businessId') businessId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      return await firstValueFrom(
        this.client.send('markOrderAsDelivered', { id, businessId }),
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
