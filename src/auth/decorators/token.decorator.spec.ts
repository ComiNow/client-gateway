import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { tokenDecoratorFactory } from './token.decorator';

jest.unmock('./token.decorator');

describe('Token Decorator Factory', () => {
  const mockToken = 'jwt-token-123';

  it('should return token from request', () => {
    const mockExecutionContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          token: mockToken,
        }),
      }),
    });

    const result = tokenDecoratorFactory(null, mockExecutionContext);
    expect(result).toBe(mockToken);
  });

  it('should throw InternalServerErrorException if token not found', () => {
    const mockExecutionContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
        }),
      }),
    });

    expect(() => tokenDecoratorFactory(null, mockExecutionContext)).toThrow(
      InternalServerErrorException,
    );
  });
});