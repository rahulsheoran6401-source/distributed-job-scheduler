import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { logger } from '../logger';
import { CustomRequest } from './correlationId';

export const errorHandler = (err: any, req: CustomRequest, res: Response, next: NextFunction) => {
  logger.error({ 
    err, 
    correlationId: req.correlationId,
    path: req.path, 
    method: req.method 
  }, 'Unhandled Exception');

  // Handle known errors (e.g., Zod Validation, JWT errors, etc.)
  if (err.name === 'ZodError') {
    return sendError(res, 'Validation Error', 400, { issues: err.issues });
  }

  if (err.name === 'UnauthorizedError') {
    return sendError(res, 'Unauthorized', 401);
  }

  // Default to 500
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;
  
  return sendError(res, message, statusCode, { correlationId: req.correlationId });
};
