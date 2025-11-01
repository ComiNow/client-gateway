import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class BusinessOwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skipBusinessCheck = this.reflector.get<boolean>(
      'skipBusinessCheck',
      context.getHandler(),
    );

    if (skipBusinessCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true;
    }

    const businessIdFromParams = request.params.businessId || request.params.id;
    const businessIdFromBody = request.body?.businessId;
    const businessIdFromQuery = request.query?.businessId;

    const requestBusinessId =
      businessIdFromParams || businessIdFromBody || businessIdFromQuery;

    if (!requestBusinessId) {
      return true;
    }

    if (user.businessId !== requestBusinessId) {
      throw new ForbiddenException(
        'No tiene permisos para acceder a los recursos de este negocio',
      );
    }

    return true;
  }
}
