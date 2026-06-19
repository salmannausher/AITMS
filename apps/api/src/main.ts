import 'reflect-metadata';
// Polyfill WebSocket for Node.js < 22 (needed by @supabase/supabase-js)
import WebSocket from 'ws';
if (!('WebSocket' in globalThis)) {
  (globalThis as unknown as Record<string, unknown>)['WebSocket'] = WebSocket;
}
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env['SENTRY_DSN'],
  environment: process.env['NODE_ENV'] ?? 'development',
  tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 0,
  enabled: !!process.env['SENTRY_DSN'],
});

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SentryExceptionFilter } from './sentry/sentry.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalFilters(new SentryExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env['CORS_ORIGINS']?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  if (
    process.env['NODE_ENV'] === 'production' &&
    process.env['INNGEST_DEV'] !== '1' &&
    !process.env['INNGEST_SIGNING_KEY']
  ) {
    throw new Error(
      'INNGEST_SIGNING_KEY must be set in production — refusing to start with an unsigned /api/inngest endpoint',
    );
  }

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);

  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
