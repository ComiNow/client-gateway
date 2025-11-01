import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { userDecoratorFactory } from './user.decorator';

jest.unmock('./user.decorator');

describe('User Decorator Factory', () => {
  const mockUser = { id: '1', name: 'John Doe' };

  it('should return user from request', () => {
    const mockExecutionContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          user: mockUser,
        }),
      }),
    });

    const result = userDecoratorFactory(null, mockExecutionContext);
    expect(result).toBe(mockUser);
  });

  it('should throw InternalServerErrorException if user not found', () => {
    const mockExecutionContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
        }),
      }),
    });

    expect(() => userDecoratorFactory(null, mockExecutionContext)).toThrow(
      InternalServerErrorException,
    );
  });
});