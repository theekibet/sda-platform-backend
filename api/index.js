const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

// Use dynamic import for ESM compatibility
let cachedApp = null;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    // Dynamic import - works with both CommonJS and ESM builds
    const { AppModule } = await import('../dist/app.module.js');

    // Create raw Express app first
    const expressApp = express();
    
    // Create NestJS app with Express adapter
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { 
        logger: ['error', 'warn'],
        abortOnError: false 
      }
    );
    
    // CORS for Vercel + your frontend
    app.enableCors({
      origin: [
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '*',
        process.env.FRONTEND_URL || '*'
      ],
      credentials: true
    });

    // Set API prefix
    app.setGlobalPrefix('api');
    
    // Initialize app
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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};