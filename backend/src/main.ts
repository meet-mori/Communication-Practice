import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prevent Node from crashing on unhandled socket errors
  process.on('uncaughtException', (err: any) => {
    if (err?.code === 'ECONNRESET') {
      console.warn('⚠️  ECONNRESET caught — connection dropped by client');
    } else {
      console.error('Uncaught Exception:', err);
    }
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.enableCors({ origin: 'http://localhost:4200' });

  await app.listen(3000);
  console.log('✅ Backend running on http://localhost:3000');
}
bootstrap();
