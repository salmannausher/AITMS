import {
  Catch,
  type ExceptionFilter,
  type ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    if (status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('company_id', (request as Request & { companyId?: string }).companyId ?? 'unknown');
        scope.setTag('environment', process.env['NODE_ENV'] ?? 'development');
        scope.setContext('request', {
          method: request.method,
          url: request.url,
        });
        Sentry.captureException(exception);
      });
    }

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';
    response.status(status).json({ statusCode: status, message });
  }
}
