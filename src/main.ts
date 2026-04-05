// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaService } from './prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);

  // ── Required env vars ──────────────────────────────────────────────────────
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
  const optionalEnvVars = [
    'CORS_ORIGIN',
    'FRONTEND_URL',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'NODE_ENV',
  ];

  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!configService.get(envVar)) missingRequired.push(envVar);
  }
  for (const envVar of optionalEnvVars) {
    if (!configService.get(envVar)) missingOptional.push(envVar);
  }

  if (missingRequired.length > 0) {
    throw new Error(
      `Required environment variables are not defined: ${missingRequired.join(', ')}`,
    );
  }
  if (missingOptional.length > 0) {
    logger.warn(`Missing optional environment variables: ${missingOptional.join(', ')}`);
    logger.warn('Some features may not work correctly.');
  }

  // ── CORS origins ───────────────────────────────────────────────────────────
  const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:5173');
  const corsOrigins = corsOrigin.split(',').map((o: string) => o.trim());

  // ── Helmet (security headers) ──────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:', 'http:'],
          scriptSrc: ["'self'"],
          fontSrc: ["'self'"],
          connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // ── Global exception filter ────────────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter(prismaService));

  // ── Validation pipe ────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Static file serving (/uploads/) ───────────────────────────────────────
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    dotfiles: 'ignore',
    setHeaders: (res, filePath) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/plain');
      }
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  });

  // ── CORS (with WebSocket support) ──────────────────────────────────────────
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 86400,
  });

  const port = configService.get('PORT', 3000);
  const nodeEnv = configService.get('NODE_ENV', 'development');

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔗 CORS enabled for: ${corsOrigins.join(', ')}`);
  logger.log(`📁 Static files served from: /uploads/`);
  logger.log(`🛡️ Security headers enabled (helmet)`);
  logger.log(`📡 WebSocket server ready on namespace: /notifications`);

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const gracefulShutdown = async (signal: string) => {
    logger.log(`Received ${signal}, starting graceful shutdown...`);
    await app.close();
    logger.log('Application shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});