import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Trust proxy for express-rate-limit when behind reverse proxy
  const expressApp = app.getHttpAdapter().getInstance() as any;
  if (typeof expressApp.set === 'function') {
    expressApp.set('trust proxy', 1);
  }
  
  // Use Helmet for secure HTTP headers in production
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }));

  // Compress responses for better performance
  app.use(compression());

  // Global rate limiter to protect against DDoS/Brute-force
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Configure CORS using environment variables
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global prefix for API routes, excluding health check
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  // Use global validation pipe with automatic transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Use global HTTP exception filter for clean JSON responses
  app.useGlobalFilters(new AllExceptionsFilter());

  const PORT = process.env.NODE_ENV === 'production' ? (process.env.PORT || 3000) : 3001;
  await app.listen(PORT, '0.0.0.0');
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
}

bootstrap();
