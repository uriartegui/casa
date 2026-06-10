import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Atrás do Caddy todos os requests chegam do IP do proxy; sem isto o
  // rate limit (ThrottlerGuard usa req.ip) vira um balde global para
  // todos os usuários em vez de por cliente.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Colmeia API')
      .setDescription('API de organização doméstica compartilhada')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req, res) => res.json({ status: 'ok' }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
