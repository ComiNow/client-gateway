import { RpcCustomExceptionFilter } from './rpc-exception.filter';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

describe('RpcCustomExceptionFilter', () => {
  let filter: RpcCustomExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockHost: any;

  beforeEach(() => {
    filter = new RpcCustomExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    };
  });

  it('should handle empty response error', () => {
    const error = 'Empty response. There are no listeners for this message.';
    const exception = { getError: () => error } as RpcException;

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Empty response. There are no listeners for this message.',
      timestamp: expect.any(String),
    });
  });

  it('should handle RpcException with status and message', () => {
    const error = { status: 404, message: 'Not found' };
    const exception = { getError: () => error } as RpcException;

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Not found',
      timestamp: expect.any(String),
    });
  });

  it('should handle RpcException with statusCode and message', () => {
    const error = { statusCode: 400, message: 'Bad request' };
    const exception = { getError: () => error } as RpcException;

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Bad request',
      timestamp: expect.any(String),
    });
  });

  it('should handle RpcException with non-numeric statusCode', () => {
    const error = { statusCode: 'BAD', message: 'Error' };
    const exception = { getError: () => error } as RpcException;

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Error',
      timestamp: expect.any(String),
    });
  });

  it('should handle string error', () => {
    const error = 'Some error';
    const exception = { getError: () => error } as RpcException;

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Some error',
      timestamp: expect.any(String),
    });
  });

  it('should handle null error', () => {
    const error = null;
    const exception = { getError: () => error } as RpcException;

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      timestamp: expect.any(String),
    });
  });

  it('should handle undefined error', () => {
    const error = undefined;
    const exception = { getError: () => error } as RpcException;

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      timestamp: expect.any(String),
    });
  });

  it('should handle object without status or message', () => {
    const error = { someProperty: 'value' };
    const exception = { getError: () => error } as RpcException;

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      timestamp: expect.any(String),
    });
  });
});
