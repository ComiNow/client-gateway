import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

// Mock envs antes de importar
jest.mock('../config/envs', () => ({
  envs: {
    natsServiceName: 'NATS_SERVICE',
    natsServers: ['nats://localhost:4222'],
  },
}));

// Mock common antes de importar
jest.mock('../common', () => ({
  PaginationDto: class PaginationDto {
    page?: number = 1;
    limit?: number = 10;
    categoryId?: number;
  },
}));

import { TablesController } from './tables.controller';

const mockClientProxy = {
  send: jest.fn(),
};

describe('TablesController', () => {
  let controller: TablesController;
  let client: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TablesController],
      providers: [
        {
          provide: 'NATS_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    controller = module.get<TablesController>(TablesController);
    client = module.get<ClientProxy>('NATS_SERVICE');
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should find table by id', async () => {
      const tableId = '550e8400-e29b-41d4-a716-446655440000';
      const businessId = '123e4567-e89b-12d3-a456-426614174000';
      const result = { id: tableId, number: 1, businessId };

      (client.send as jest.Mock).mockReturnValue(of(result));

      const response = await controller.findOne(businessId, tableId);

      expect(client.send).toHaveBeenCalledWith('findTableById', {
        id: tableId,
        businessId,
      });
      expect(response).toBe(result);
    });
  });
});
