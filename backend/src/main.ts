import './instrument';
import { timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function swaggerAuth(req: Request, res: Response, next: NextFunction) {
  const username =
    process.env.SWAGGER_USER ??
    (process.env.NODE_ENV === 'production' ? undefined : 'admin');
  const password =
    process.env.SWAGGER_PASSWORD ??
    (process.env.NODE_ENV === 'production' ? undefined : 'admin');

  if (!username || !password) {
    res.status(503).send('Swagger credentials are not configured.');
    return;
  }

  const [scheme, credentials] = (req.headers.authorization ?? '').split(' ');

  if (scheme === 'Basic' && credentials) {
    const [providedUser, providedPassword] = Buffer.from(credentials, 'base64')
      .toString('utf8')
      .split(':');

    if (
      safeCompare(providedUser ?? '', username) &&
      safeCompare(providedPassword ?? '', password)
    ) {
      next();
      return;
    }
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Colmeia Swagger"');
  res.status(401).send('Authentication required.');
}

function setupSwagger(app: INestApplication) {
  const swaggerEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_SWAGGER === 'true';

  if (!swaggerEnabled) {
    return;
  }

  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.SWAGGER_USER || !process.env.SWAGGER_PASSWORD)
  ) {
    throw new Error(
      'SWAGGER_USER and SWAGGER_PASSWORD are required when ENABLE_SWAGGER=true in production.',
    );
  }

  const http = app.getHttpAdapter().getInstance();
  http.use('/docs', swaggerAuth);
  http.use('/docs-json', swaggerAuth);

  const config = new DocumentBuilder()
    .setTitle('Colmeia API')
    .setDescription('API de organizacao domestica compartilhada')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Atras do Caddy todos os requests chegam do IP do proxy; sem isto o
  // rate limit (ThrottlerGuard usa req.ip) vira um balde global para
  // todos os usuarios em vez de por cliente.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  setupSwagger(app);

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req, res) => res.json({ status: 'ok' }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
