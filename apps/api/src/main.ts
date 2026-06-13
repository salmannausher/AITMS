import 'reflect-metadata';
// Polyfill WebSocket for Node.js < 22 (needed by @supabase/supabase-js)
import WebSocket from 'ws';
if (!('WebSocket' in globalThis)) {
  (globalThis as unknown as Record<string, unknown>)['WebSocket'] = WebSocket;
}
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);

  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
