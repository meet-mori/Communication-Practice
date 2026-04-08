import { HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

type ApiEnvelope<T = unknown> = {
  status: 'success' | 'error';
  data: T;
  message: string;
  code: number;
};

function isApiEnvelope<T>(body: unknown): body is ApiEnvelope<T> {
  return !!body
    && typeof body === 'object'
    && 'status' in body
    && 'data' in body
    && 'message' in body
    && 'code' in body;
}

export const apiInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('ec_token') : null;
  const authRequest = token && !request.headers.has('Authorization')
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authRequest).pipe(
    map((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse && isApiEnvelope(event.body)) {
        return event.clone({ body: event.body.data });
      }

      return event;
    }),
  );
};
