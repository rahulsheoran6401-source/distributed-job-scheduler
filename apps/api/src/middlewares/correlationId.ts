import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface CustomRequest extends Request {
  correlationId?: string;
}

export const correlationIdMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Attach correlation ID to request logger
  if (req.log) {
    req.log = req.log.child({ correlationId });
  }

  next();
};
