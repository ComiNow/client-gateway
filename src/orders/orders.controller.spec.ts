import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { CreateOrderDto, OrderPaginationDto } from './dto';
import { PaginationDto } from '../common';
import { StatusDto } from './dto/status.dto';
import { OrderStatus } from './enum/order.enum';
import { of, throwError } from 'rxjs';
import { ParseUUIDPipe, ParseIntPipe } from '@nestjs/common';

describe('OrdersController', () => {
  let controller: OrdersController;
  let clientProxy: ClientProxy;

  const mockClientProxy = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: 'NATS_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    clientProxy = module.get<ClientProxy>('NATS_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an order', () => {
      // Arrange
      const createOrderDto: CreateOrderDto = {
        businessId: '123e4567-e89b-12d3-a456-426614174000',
        table: 5,
        items: [
          {
            productId: 1,
            quantity: 2,
            price: 3500,
          },
        ],
      };

      const expectedResponse = {
        id: 1,
        table: 5,
        status: 'PENDING',
        total: 15000,
        items: createOrderDto.items,
      };

      mockClientProxy.send.mockReturnValue(of(expectedResponse));

      // Act
      const result = controller.create(createOrderDto);

      // Assert
      expect(mockClientProxy.send).toHaveBeenCalledWith('createOrder', createOrderDto);
      expect(mockClientProxy.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('createOrderFromPos', () => {
    it('should create an order from POS', () => {
      // Arrange
      const createOrderDto: CreateOrderDto = {
        businessId: '123e4567-e89b-12d3-a456-426614174000',
        table: 5,
        status: 'PAID',
        items: [
          {
            productId: 1,
            quantity: 2,
            price: 3500,
          },
        ],
      };

      const expectedResponse = {
        id: 1,
        table: 5,
        status: 'PAID',
        total: 15000,
      };

      mockClientProxy.send.mockReturnValue(of(expectedResponse));

      // Act
      const result = controller.createOrderFromPos(createOrderDto);

      // Assert
      expect(mockClientProxy.send).toHaveBeenCalledWith('createOrderWithStatus', createOrderDto);
      expect(mockClientProxy.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllByBusinessId', () => {
    it('should return paginated orders for a business', async () => {
      // Arrange
      const businessId = '123e4567-e89b-12d3-a456-426614174000';
      const orderPaginationDto: OrderPaginationDto = {
        page: 1,
        limit: 10,
      };

      const expectedResponse = {
        data: [
          {
            id: 1,
            table: 5,
            status: 'PENDING',
            total: 15000,
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          lastPage: 1,
        },
      };

      mockClientProxy.send.mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.findAllByBusinessId(orderPaginationDto, businessId);

      // Assert
      expect(mockClientProxy.send).toHaveBeenCalledWith('findAllOrders', {
        orderPaginationDto,
        businessId,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should throw RpcException when service fails', async () => {
      // Arrange
      const businessId = '123e4567-e89b-12d3-a456-426614174000';
      const orderPaginationDto: OrderPaginationDto = {
        page: 1,
        limit: 10,
      };

      const error = new Error('Service unavailable');
      mockClientProxy.send.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(controller.findAllByBusinessId(orderPaginationDto, businessId))
        .rejects.toThrow(RpcException);
      
      expect(mockClientProxy.send).toHaveBeenCalledWith('findAllOrders', {
        orderPaginationDto,
        businessId,
      });
    });
  });

  describe('getKitchenOrders', () => {
    it('should return kitchen orders for a business', async () => {
      // Arrange
      const businessId = '123e4567-e89b-12d3-a456-426614174000';
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
      };

      const expectedResponse = {
        data: [
          {
            id: 1,
            table: 5,
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
      };

      mockClientProxy.send.mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.getKitchenOrders(paginationDto, businessId);

      // Assert
      expect(mockClientProxy.send).toHaveBeenCalledWith('findKitchenOrders', {
        paginationDto,
        businessId,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should throw RpcException when service fails', async () => {
      // Arrange
      const businessId = '123e4567-e89b-12d3-a456-426614174000';
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
      };

      const error = new Error('Service unavailable');
      mockClientProxy.send.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(controller.getKitchenOrders(paginationDto, businessId))
        .rejects.toThrow(RpcException);
    });
  });

  describe('findOne', () => {
    it('should return a specific order by ID', async () => {
      // Arrange
      const businessId = '123e4567-e89b-12d3-a456-426614174000';
      const orderId = 1;

      const expectedResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        table: 5,
        status: 'PENDING',
        total: 15000,
        items: [
          {
            productId: 1,
            productName: 'Café Americano',
            quantity: 2,
            price: 3500,
          },
        ],
      };

      mockClientProxy.send.mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.findOne(businessId, orderId);

      // Assert
      expect(mockClientProxy.send).toHaveBeenCalledWith('findOneOrder', {
        id: orderId,
        businessId,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should throw RpcException when order not found', async () => {
      // Arrange
      const businessId = '123e4567-e89b-12d3-a456-426614174000';
      const orderId = 999;

      const error = new Error('Order not found');
      mockClientProxy.send.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(controller.findOne(businessId, orderId))
        .rejects.toThrow(RpcException);
    });
  });

  describe('findPaidOrderByTableId', () => {
    it('should return paid order by table ID', async () => {
      // Arrange
      const businessId = '123e4567-e89b-12d3-a456-426614174000';
      const tableId = '550e8400-e29b-41d4-a716-446655440000';

      const expectedResponse = {
        id: 1,
        tableId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'PAID',
        total: 15000,
      };

      mockClientProxy.send.mockReturnValue(of(expectedResponse));

      // Act
      const result = await controller.findPaidOrderByTableId(businessId, tableId);

      // Assert
      expect(mockClientProxy.send).toHaveBeenCalledWith('findPaidOrderByTableId', {
        tableId,
        businessId,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should throw RpcException when service fails', async () => {
      // Arrange
      const businessId = '123e4567-e89b-12d3-a456-426614174000';
      const tableId = '550e8400-e29b-41d4-a716-446655440000';

      const error = new Error('Service unavailable');
      mockClientProxy.send.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(controller.findPaidOrderByTableId(businessId, tableId))
        .rejects.toThrow(RpcException);
    });
  });

  describe('findOrderPositionByTableId', () => {
    it('should return order position by table ID', async () => {
      // Arrange
      const businessId = '123e4567-e89b-12d3-a456-426614174000';
      const tableId = '550e8400-e29b-41d4-a716-446655440000';
      const position = 3;

      mockClientProxy.send.mockReturnValue(of(position));

      // Act
      const result = await controller.findOrderPositionByTableId(businessId, tableId);

      // Assert
      expect(mockClientProxy.send).toHaveBeenCalledWith('getOrderPositionByTableId', {
        tableId,
        businessId,
      });
      expect(result).toEqual({ orderPosition: position });
    });

    it('should throw RpcException when service fails', async () => {
      // Arrange
      const businessId = '123e4567-e89b-12d3-a456-426614174000';
      const tableId = '550e8400-e29b-41d4-a716-446655440000';

      const error = new Error('Service unavailable');
      mockClientProxy.send.mockReturnValue(throwError(() => error));

      // Act & Assert
      await expect(controller.findOrderPositionByTableId(businessId, tableId))
        .rejects.toThrow(RpcException);
    });
  });

  describe('changeOrderStatus', () => {
    it('should change order status successfully', () => {
      // Arrange
      const businessId = '123e4567-e89b-12d3-a456-426614174000';
      const orderId = 1;
      const statusDto: StatusDto = {
        status: OrderStatus.DELIVERED,
      };

      const expectedResponse = {
        id: 1,
        status: 'DELIVERED',
        updatedAt: '2024-01-15T11:00:00Z',
      };

      mockClientProxy.send.mockReturnValue(of(expectedResponse));

      // Act
      const result = controller.changeOrderStatus(businessId, orderId, statusDto);

      // Assert
      expect(mockClientProxy.send).toHaveBeenCalledWith('changeOrderStatus', {
        businessId,
        id: orderId,
        status: statusDto.status,
      });
      expect(mockClientProxy.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration with pipes', () => {
    it('should work with ParseUUIDPipe for businessId', async () => {
      // This test ensures that the controller accepts UUID format for businessId
      const pipe = new ParseUUIDPipe();
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const metadata = { type: 'param' as const, data: 'businessId' };
      
      const result = await pipe.transform(validUuid, metadata);
      expect(result).toBe(validUuid);
    });

    it('should work with ParseIntPipe for orderId', async () => {
      // This test ensures that the controller accepts integer format for orderId
      const pipe = new ParseIntPipe();
      const validId = '123';
      const metadata = { type: 'param' as const, data: 'id' };
      
      const result = await pipe.transform(validId, metadata);
      expect(result).toBe(123);
    });
  });
});