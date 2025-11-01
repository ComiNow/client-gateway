import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';

const mockClientProxy = { send: jest.fn() };

describe('AuthController - Prueba de Carga', () => {
  it('debería poder compilar el módulo sin errores de decorador', async () => {
    let module: TestingModule | undefined;
    let error: Error | undefined;

    try {
      module = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [{ provide: 'NATS_SERVICE', useValue: mockClientProxy }],
      }).compile();
    } catch (e) {
      error = e;
    }

    expect(error).toBeUndefined();
    expect(module).toBeDefined();
  });
});