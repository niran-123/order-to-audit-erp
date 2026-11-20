import morgan from 'morgan';
import { Request, Response } from 'express';

export const requestLogger = morgan(':method :url :status :res[content-length] - :response-time ms');

export function correlationMiddleware(req: Request, res: Response, next: () => void) {
  const correlationId = (req.headers['x-correlation-id'] as string) || `req-${Math.random().toString(36).substring(2, 9)}`;
  res.setHeader('x-correlation-id', correlationId);
  (req as any).correlationId = correlationId;
  next();
}
