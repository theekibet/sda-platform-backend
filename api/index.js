const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');
const path = require('path');

let cachedApp = null;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    const distPath = path.join(process.cwd(), 'dist');
    const { AppModule } = await import(path.join(distPath, 'app.module.js'));

    const expressApp = express();

    expressApp.get('/', (req, res) => {
      res.status(200).send('SDA Platform API is running');
    });

    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      {
        logger: ['error', 'warn'],
        abortOnError: false,
      }
    );

    app.enableCors({
      origin: [
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '*',
        process.env.FRONTEND_URL || '*',
      ],
      credentials: true,
    });

    app.setGlobalPrefix('api');

    await app.init();

    cachedApp = expressApp;
    console.log('NestJS app bootstrapped successfully');
    return expressApp;
  } catch (error) {
    console.error('Bootstrap failed:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    const server = await bootstrap();
    server(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};