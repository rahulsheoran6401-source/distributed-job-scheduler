import { PrismaClient } from '@prisma/client';
import { redisClient } from '../utils/redis';

const prisma = new PrismaClient();

export class HealthService {
  static async checkDatabase(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (e) {
      return false;
    }
  }

  static async checkRedis(): Promise<boolean> {
    try {
      const response = await redisClient.ping();
      return response === 'PONG';
    } catch (e) {
      return false;
    }
  }

  static async checkWorkers(): Promise<boolean> {
    try {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      const activeWorkers = await prisma.worker.count({
        where: {
          lastHeartbeat: {
            gte: thirtySecondsAgo,
          },
        },
      });
      return activeWorkers > 0;
    } catch (e) {
      return false;
    }
  }

  static async checkScheduler(): Promise<boolean> {
    // Return true if process exists. No model for scheduler heartbeat.
    return true;
  }

  static async checkApi(): Promise<boolean> {
    return true;
  }

  static async checkSocket(): Promise<boolean> {
    return true;
  }

  static async getHealthStatus() {
    const [database, redis, workers, scheduler, api, socket] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkWorkers(),
      this.checkScheduler(),
      this.checkApi(),
      this.checkSocket(),
    ]);

    const isHealthy = database && redis && api && socket; // workers/scheduler might legitimately be 0/down but api is up

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      details: {
        database,
        redis,
        workers,
        scheduler,
        api,
        socket,
      },
    };
  }
}
