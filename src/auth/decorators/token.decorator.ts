import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const tokenDecoratorFactory = (data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const token = request.token;

  if (!token) {
    throw new InternalServerErrorException('Token not found in request');
  }

  return token;
};

export const Token = createParamDecorator(tokenDecoratorFactory);