import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { of } from 'rxjs';

// Mock config antes de importar
jest.mock('../config', () => ({
  NATS_SERVICE: 'NATS_SERVICE',
}));

// Mock common antes de importar
jest.mock('../common', () => ({
  PaginationDto: class PaginationDto {
    page?: number = 1;
    limit?: number = 10;
    categoryId?: number;
  },
}));

import { ProductsController } from './products.controller';
import { PaginationDto } from '../common';

const mockClientProxy = {
  send: jest.fn(),
};

describe('ProductsController', () => {
  let controller: ProductsController;
  let client: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: 'NATS_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    client = module.get<ClientProxy>('NATS_SERVICE');
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProduct', () => {
    it('should create a product with array image', () => {
      const createDto: CreateProductDto = {
        name: 'Test Product',
        price: 10.5,
        stock: 100,
        categoryId: 1,
        image: ['image1.jpg'],
      };

      (client.send as jest.Mock).mockReturnValue(of({ id: 1, ...createDto }));

      controller.createProduct(createDto);

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'create_product' },
        createDto,
      );
    });

    it('should convert single image to array', () => {
      const createDto: CreateProductDto = {
        name: 'Test Product',
        price: 10.5,
        stock: 100,
        categoryId: 1,
        image: 'single-image.jpg' as any,
      };

      (client.send as jest.Mock).mockReturnValue(of({ id: 1 }));

      controller.createProduct(createDto);

      expect(createDto.image).toEqual(['single-image.jpg']);
      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'create_product' },
        createDto,
      );
    });
  });

  describe('findAllProducts', () => {
    it('should find all products', () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const result = { data: [], meta: {} };

      (client.send as jest.Mock).mockReturnValue(of(result));

      controller.findAllProducts(paginationDto);

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'find_all_products' },
        paginationDto,
      );
    });
  });

  describe('getTopSellingProducts', () => {
    it('should get top selling products with default limit', async () => {
      const result = { data: [], meta: {} };

      (client.send as jest.Mock).mockReturnValue(of(result));

      const response = await controller.getTopSellingProducts();

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'find_top_selling_products' },
        5,
      );
      expect(response).toBe(result);
    });

    it('should get top selling products with custom limit', async () => {
      const result = { data: [], meta: {} };

      (client.send as jest.Mock).mockReturnValue(of(result));

      const response = await controller.getTopSellingProducts(10);

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'find_top_selling_products' },
        10,
      );
      expect(response).toBe(result);
    });
  });

  describe('findOne', () => {
    it('should find one product', async () => {
      const result = { id: 1, name: 'Product' };

      (client.send as jest.Mock).mockReturnValue(of(result));

      const response = controller.findOne('1');

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'find_one_product' },
        { id: '1' },
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', () => {
      const result = { id: 1, available: false };

      (client.send as jest.Mock).mockReturnValue(of(result));

      controller.deleteProduct('1');

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'delete_product' },
        { id: '1' },
      );
    });
  });

  describe('patchProduct', () => {
    it('should update a product with array image', () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
        image: ['image1.jpg'],
      };

      (client.send as jest.Mock).mockReturnValue(of({ id: 1, ...updateDto }));

      controller.patchProduct(1, updateDto);

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'update_product' },
        { id: 1, ...updateDto },
      );
    });

    it('should convert single image to array when updating', () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
        image: 'single-image.jpg' as any,
      };

      (client.send as jest.Mock).mockReturnValue(of({ id: 1 }));

      controller.patchProduct(1, updateDto);

      expect(updateDto.image).toEqual(['single-image.jpg']);
      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'update_product' },
        { id: 1, ...updateDto },
      );
    });
  });
});
