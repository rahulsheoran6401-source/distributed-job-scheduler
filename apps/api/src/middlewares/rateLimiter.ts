import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../utils/redis';
import { sendError } from '../utils/response';
import { logger } from '../logger';

export const rateLimiter = (options: { limit: number; windowSeconds: number; keyPrefix: string }) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `ratelimit:${options.keyPrefix}:${ip}`;
      
      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, options.windowSeconds);
      }

      if (current > options.limit) {
        return sendError(res, 'Too many requests, please try again later.', 429);
      }

      next();
    } catch (err) {
      logger.error({ err }, 'Rate limiter error');
      // Fail open to not block valid requests if Redis is down
      next();
    }
  };
};
