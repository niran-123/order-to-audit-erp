import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestLogger, correlationMiddleware } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes';
import { NotFoundError } from './utils/appError';

export function createApp(): Application {
  const app = express();

  // 1. Security Headers & CORS
  app.use(helmet());
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error(`CORS origin ${origin} not allowed by policy`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
    }),
  );

  // 2. Request Parsing & Correlation ID
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(correlationMiddleware);

  // 3. HTTP Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  // 4. API v1 Routing
  app.use('/api/v1', apiRouter);

  // 5. Root route
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Order-to-Audit ERP API',
      version: '1.0.0',
      status: 'operational',
      docs: '/api/v1/health',
    });
  });

  // 6. 404 Handler
  app.use((req: Request) => {
    throw new NotFoundError(`Cannot ${req.method} ${req.originalUrl} - Route not found`);
  });

  // 7. Global Centralized Error Handling
  app.use(errorHandler);

  return app;
}
