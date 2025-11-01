import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

// Interfaz para tipar el error
interface RpcErrorObject {
  status?: number;
  statusCode?: number | string;
  message?: string;
}

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const rpcError = exception.getError();

    let status = 500;
    let message = 'Internal server error';

    // Manejar null o undefined
    if (!rpcError) {
      response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Error de respuesta vacía
    if (typeof rpcError === 'string' && rpcError.includes('Empty response')) {
      message = 'Empty response. There are no listeners for this message.';
    } else if (typeof rpcError === 'string') {
      message = rpcError;
    } else if (typeof rpcError === 'object') {
      // Hacer cast del error para acceder a sus propiedades
      const errorObj = rpcError as RpcErrorObject;

      // Manejar objetos de error
      if (errorObj.status && typeof errorObj.status === 'number') {
        status = errorObj.status;
      } else if (
        errorObj.statusCode &&
        typeof errorObj.statusCode === 'number'
      ) {
        status = errorObj.statusCode;
      }

      if (errorObj.message) {
        message = errorObj.message;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
