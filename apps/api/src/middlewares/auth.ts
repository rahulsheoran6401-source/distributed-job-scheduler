import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@job-scheduler-system/config';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Unauthorized', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };
    next();
  } catch (err) {
    return sendError(res, 'Unauthorized: Invalid token', 401);
  }
};
