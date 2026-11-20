import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return sendError(
      res,
      err.message,
      err.statusCode,
      err.constructor.name.replace('Error', '_ERROR').toUpperCase(),
      err.details,
    );
  }

  // Handle Prisma Known Request Errors
  if ((err as any)?.code?.startsWith('P')) {
    const prismaCode = (err as any).code;
    return sendError(
      res,
      `Database operation failed: ${err.message}`,
      400,
      `PRISMA_${prismaCode}`,
      env.NODE_ENV === 'development' ? (err as any).meta : undefined,
    );
  }

  // Unhandled / Internal Server Error
  console.error('Unhandled Server Exception:', err);
  return sendError(
    res,
    env.NODE_ENV === 'production' ? 'Internal server error occurred' : err.message,
    500,
    'INTERNAL_SERVER_ERROR',
    env.NODE_ENV === 'development' ? { stack: err.stack } : undefined,
  );
}
