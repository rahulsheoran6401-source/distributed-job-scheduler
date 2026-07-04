import { createClient } from 'redis';
import { env } from '@job-scheduler-system/config';
import { logger } from '../logger';

export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (err) => logger.error({ err }, 'Redis Client Error'));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error({ err }, 'Failed to connect to Redis');
  }
};
