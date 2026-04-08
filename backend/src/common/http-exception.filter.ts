import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from './api-response';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        message = payload;
      } else if (Array.isArray((payload as any)?.message)) {
        message = (payload as any).message.join(', ');
      } else if (typeof (payload as any)?.message === 'string') {
        message = (payload as any).message;
      } else if (typeof (payload as any)?.error === 'string') {
        message = (payload as any).error;
      } else if (exception.message.trim()) {
        message = exception.message;
      }
    } else if (exception instanceof Error && exception.message.trim()) {
      message = exception.message;
    }

    const body: ApiResponse = {
      status: 'error',
      data: null,
      message,
      code: statusCode,
    };

    response.status(statusCode).json(body);
  }
}
