import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const userDecoratorFactory = (data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  console.log('User Decorator', user);

  return user || null;
};

export const User = createParamDecorator(userDecoratorFactory);
