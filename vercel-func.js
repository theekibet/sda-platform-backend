// vercel-func.js
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');
const { AppModule } = require('./dist/app.module');

let cachedApp = null;
let cachedServer = null;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }

  // Create a raw Express server
  const expressApp = express();
  
  // Create NestJS app using the Express adapter
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp)
  );
  
  // Enable CORS for your React frontend
  app.enableCors();
  
  // Initialize the app
  await app.init();
  
  cachedApp = app;
  cachedServer = expressApp;
  return app;
}

module.exports = async (req, res) => {
  await bootstrap();
  cachedServer(req, res);
};