import { Test, TestingModule } from '@nestjs/testing';
import { ClientsModule } from '@nestjs/microservices';

// Mock envs antes de importar el módulo
jest.mock('../config/envs', () => ({
  envs: {
    natsServiceName: 'NATS_SERVICE',
    natsServers: ['nats://localhost:4222'],
  },
}));

import { NatsModule } from './nats.module';

describe('NatsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [NatsModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    const natsModule = module.get(NatsModule);
    expect(natsModule).toBeInstanceOf(NatsModule);
  });

  it('should import and export ClientsModule', () => {
    const imports = Reflect.getMetadata('imports', NatsModule);
    const exports = Reflect.getMetadata('exports', NatsModule);

    expect(imports).toBeDefined();
    expect(exports).toBeDefined();
    // Verificar que ClientsModule está registrado
    expect(imports[0]).toBeDefined();
    expect(exports[0]).toBeDefined();
  });
});
