import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { UnauthorizedException } from '@nestjs/common';
import { of } from 'rxjs';

// Mock envs antes de importar
jest.mock('../../config/envs', () => ({
  envs: {
    natsServiceName: 'NATS_SERVICE',
    natsServers: ['nats://localhost:4222'],
  },
}));

import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let client: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: 'NATS_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    client = module.get<ClientProxy>('NATS_SERVICE');
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access to excluded routes', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/', method: 'GET' }),
      }),
    } as any;

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should allow access to login route', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/api/auth/login', method: 'POST' }),
      }),
    } as any;

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should allow access to public products routes', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/api/products', method: 'GET' }),
      }),
    } as any;

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should allow access to public categories routes', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/api/categories', method: 'GET' }),
      }),
    } as any;

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should allow access with valid token', async () => {
    const mockRequest = {
      path: '/api/protected',
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;

    const mockUser = { id: '1', fullName: 'Test User' };
    const mockToken = 'new-token';
    (client.send as jest.Mock).mockReturnValue(
      of({ user: mockUser, token: mockToken }),
    );

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(mockRequest['user']).toEqual(mockUser);
    expect(mockRequest['token']).toEqual(mockToken);
    expect(client.send).toHaveBeenCalledWith('auth.verify.user', 'valid-token');
  });

  it('should throw UnauthorizedException for invalid token', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          path: '/api/protected',
          method: 'GET',
          headers: { authorization: 'Bearer invalid-token' },
        }),
      }),
    } as any;

    (client.send as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
