import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const logger = new Logger('Bootstrap');

  const corsOrigins = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.use(
    json({
      verify: (
        req: IncomingMessage & { rawBody?: Buffer },
        _res: ServerResponse,
        buf: Buffer,
      ) => {
        req.rawBody = buf;
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Define Payments API')
    .setDescription('Create and manage payment requests.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('payments')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('dfn/p/swagger', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT ?? 3004);
  await app.listen(port, '0.0.0.0');
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`CORS enabled for: ${corsOrigins.join(', ')}`);
}
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error.stack);
  process.exitCode = 1;
});
