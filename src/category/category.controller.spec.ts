import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { of } from 'rxjs';

jest.mock('../config', () => ({
  NATS_SERVICE: 'NATS_SERVICE',
}));

import { CategoryController } from './category.controller';

const mockClientProxy = {
  send: jest.fn(),
};

describe('CategoryController', () => {
  let controller: CategoryController;
  let client: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: 'NATS_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    client = module.get<ClientProxy>('NATS_SERVICE');
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a category without files', () => {
      const createDto: CreateCategoryDto = {
        name: 'Test Category',
        firstImage: 'https://example.com/image1.jpg',
      };

      (client.send as jest.Mock).mockReturnValue(of({ id: 1, ...createDto }));

      controller.create(createDto);

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'create_category' },
        createDto,
      );
    });

    it('should create a category with uploaded files', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Test Category',
      };

      const files = {
        firstImage: [
          {
            originalname: 'test1.jpg',
            mimetype: 'image/jpeg',
            size: 1000,
            buffer: Buffer.from('test'),
          },
        ] as Express.Multer.File[],
        secondImage: [
          {
            originalname: 'test2.jpg',
            mimetype: 'image/jpeg',
            size: 1000,
            buffer: Buffer.from('test'),
          },
        ] as Express.Multer.File[],
      };

      jest
        .spyOn(controller as any, 'uploadCategoryImage')
        .mockResolvedValue({ fileName: 'uploaded-url.jpg' });
      (client.send as jest.Mock).mockReturnValue(of({ id: 1 }));

      await controller.create(createDto, files);

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'create_category' },
        expect.objectContaining({
          name: 'Test Category',
          firstImage: 'uploaded-url.jpg',
          secondImage: 'uploaded-url.jpg',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should find all categories', () => {
      const result = [{ id: 1, name: 'Category 1' }];

      (client.send as jest.Mock).mockReturnValue(of(result));

      controller.findAll();

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'find_all_categories' },
        {},
      );
    });
  });

  describe('findOne', () => {
    it('should find one category', () => {
      const result = { id: 1, name: 'Category 1' };

      (client.send as jest.Mock).mockReturnValue(of(result));

      controller.findOne('1');

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'find_one_category' },
        { id: 1 },
      );
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateDto: UpdateCategoryDto = {
        name: 'Updated Category',
      };

      (client.send as jest.Mock).mockReturnValue(of({ id: 1, ...updateDto }));

      await controller.update('1' as any, updateDto);

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'update_category' },
        { id: '1', ...updateDto },
      );
    });
  });

  describe('remove', () => {
    it('should remove a category', () => {
      const result = { id: 1, available: false };

      (client.send as jest.Mock).mockReturnValue(of(result));

      controller.remove('1');

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'remove_category' },
        { id: 1 },
      );
    });
  });

  describe('findAllIncludingDeleted', () => {
    it('should find all categories including deleted', () => {
      const result = [
        { id: 1, name: 'Category 1', available: true },
        { id: 2, name: 'Category 2', available: false },
      ];

      (client.send as jest.Mock).mockReturnValue(of(result));

      controller.findAllIncludingDeleted();

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'find_all_categories_including_deleted' },
        {},
      );
    });
  });

  describe('restore', () => {
    it('should restore a deleted category', () => {
      const result = { id: 1, available: true };

      (client.send as jest.Mock).mockReturnValue(of(result));

      controller.restore('1');

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'restore_category' },
        { id: 1 },
      );
    });
  });
});
