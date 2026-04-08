import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { ApiResponse } from './api-response';
import { SKIP_RESPONSE_ENVELOPE } from './response-envelope.decorator';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const shouldSkip = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_ENVELOPE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (shouldSkip) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data): ApiResponse => ({
        status: 'success',
        data: typeof data === 'undefined' ? null : data,
        message: 'Success',
        code: response?.statusCode || 200,
      })),
    );
  }
}
