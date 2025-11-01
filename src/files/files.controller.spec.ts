import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';

jest.mock('../config', () => ({
  NATS_SERVICE: 'NATS_SERVICE',
}));

import { FilesController } from './files.controller';

const mockClientProxy = {
  send: jest.fn(),
};

describe('FilesController', () => {
  let controller: FilesController;
  let client: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: 'NATS_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    client = module.get<ClientProxy>('NATS_SERVICE');
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadProductImage', () => {
    it('should upload a product image', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockResult = { fileName: 'uploaded-url.jpg' };

      (client.send as jest.Mock).mockReturnValue(of(mockResult));

      const result = await controller.uploadProductImage(mockFile);

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'upload_product_image' },
        expect.objectContaining({
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1000,
          buffer: Buffer.from('test').toString('base64'),
        }),
      );
      expect(result).toBe(mockResult);
    });

    it('should throw BadRequestException if no file uploaded', async () => {
      await expect(controller.uploadProductImage(undefined)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.uploadProductImage(undefined)).rejects.toThrow(
        'No file uploaded',
      );
    });
  });

  describe('uploadCategoryImage', () => {
    it('should upload a category image with first type', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockResult = { fileName: 'uploaded-url.jpg' };

      (client.send as jest.Mock).mockReturnValue(of(mockResult));

      const result = await controller.uploadCategoryImage(mockFile, 'first');

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'upload_category_image' },
        {
          file: expect.objectContaining({
            originalname: 'test.jpg',
            mimetype: 'image/jpeg',
            size: 1000,
            buffer: Buffer.from('test').toString('base64'),
          }),
          type: 'first',
        },
      );
      expect(result).toBe(mockResult);
    });

    it('should upload a category image with second type', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockResult = { fileName: 'uploaded-url.jpg' };

      (client.send as jest.Mock).mockReturnValue(of(mockResult));

      const result = await controller.uploadCategoryImage(mockFile, 'second');

      expect(client.send).toHaveBeenCalledWith(
        { cmd: 'upload_category_image' },
        {
          file: expect.any(Object),
          type: 'second',
        },
      );
      expect(result).toBe(mockResult);
    });

    it('should throw BadRequestException if no file uploaded', async () => {
      await expect(
        controller.uploadCategoryImage(undefined, 'first'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadCategoryImage(undefined, 'first'),
      ).rejects.toThrow('No file uploaded');
    });

    it('should throw BadRequestException if invalid type', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      await expect(
        controller.uploadCategoryImage(mockFile, 'invalid'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadCategoryImage(mockFile, 'invalid'),
      ).rejects.toThrow('Type must be "first" or "second"');
    });
  });

  describe('serializeFile', () => {
    it('should serialize file correctly', () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const serializedFile = (controller as any).serializeFile(mockFile);

      expect(serializedFile).toEqual({
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1000,
        buffer: Buffer.from('test').toString('base64'),
      });
    });
  });
});
