import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/response';

const prisma = new PrismaClient();

export const getSystemMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalJobs, runningJobs, failedJobs, onlineWorkers, queuesCount, dlqCount,
      recentJobs, recentFailures,
      workerActivity, queueStats
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'RUNNING' } }),
      prisma.job.count({ where: { status: 'FAILED' } }),
      prisma.worker.count({ where: { status: 'ONLINE' } }),
      prisma.queue.count(),
      prisma.job.count({ where: { status: 'DLQ' } }),
      
      // Recent Jobs
      prisma.job.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { queue: { select: { name: true } } }
      }),
      
      // Recent Failures
      prisma.job.findMany({
        where: { status: 'FAILED' },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: { queue: { select: { name: true } } }
      }),
      
      // Worker Activity
      prisma.worker.findMany({
        take: 10,
        orderBy: { lastHeartbeat: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          lastHeartbeat: true,
          _count: {
            select: { jobs: true }
          }
        }
      }),

      // For Top, Fastest, Slowest Queue, let's just group by queueId
      prisma.job.groupBy({
        by: ['queueId'],
        _count: { _all: true },
        _avg: { executionDuration: true },
        where: { status: 'COMPLETED', executionDuration: { not: null } }
      })
    ]);

    let topQueue = null;
    let fastestQueue = null;
    let slowestQueue = null;

    if (queueStats.length > 0) {
      const topQueueStats = [...queueStats].sort((a: any, b: any) => b._count._all - a._count._all)[0];
      const fastestQueueStats = [...queueStats].sort((a: any, b: any) => (a._avg.executionDuration || 0) - (b._avg.executionDuration || 0))[0];
      const slowestQueueStats = [...queueStats].sort((a: any, b: any) => (b._avg.executionDuration || 0) - (a._avg.executionDuration || 0))[0];

      const [topQ, fastQ, slowQ] = await Promise.all([
        prisma.queue.findUnique({ where: { id: topQueueStats.queueId }, select: { name: true } }),
        prisma.queue.findUnique({ where: { id: fastestQueueStats.queueId }, select: { name: true } }),
        prisma.queue.findUnique({ where: { id: slowestQueueStats.queueId }, select: { name: true } }),
      ]);

      topQueue = { queue: topQ?.name, count: topQueueStats._count._all };
      fastestQueue = { queue: fastQ?.name, avgDuration: fastestQueueStats._avg.executionDuration };
      slowestQueue = { queue: slowQ?.name, avgDuration: slowestQueueStats._avg.executionDuration };
    }

    return sendSuccess(res, 'Metrics retrieved', { 
      totalJobsToday: totalJobs, 
      runningJobs, 
      failedJobs, 
      activeWorkers: onlineWorkers, 
      totalWorkers: onlineWorkers + 2, // Dummy total workers for now
      avgWaitTimeMs: 120, // Dummy avg wait time
      queues: queuesCount,
      dlqSize: dlqCount,
      recentJobs,
      recentFailures,
      workerActivity,
      topQueue,
      fastestQueue,
      slowestQueue
    });
  } catch (err) { next(err); }
};

export const getSystemCharts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const labels: string[] = [];
    const completedData: number[] = [];
    const failedData: number[] = [];
    
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      
      const completed = await prisma.job.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: startOfDay, lte: endOfDay }
        }
      });
      
      const failed = await prisma.job.count({
        where: {
          status: 'FAILED',
          updatedAt: { gte: startOfDay, lte: endOfDay }
        }
      });
      
      completedData.push(completed);
      failedData.push(failed);
    }

    const chartData = labels.map((label, index) => ({
      name: label,
      completed: completedData[index],
      failed: failedData[index]
    }));

    return sendSuccess(res, 'Charts retrieved', chartData);
  } catch (err) { next(err); }
};

export const getSystemActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await prisma.job.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        status: true,
        queue: { select: { name: true } },
        updatedAt: true
      }
    });

    const activity = jobs.map(job => ({
      id: job.id,
      jobId: job.id.substring(0,8),
      status: job.status,
      queueName: job.queue?.name || 'unknown',
      timestamp: job.updatedAt
    }));

    return sendSuccess(res, 'Activity retrieved', activity);
  } catch (err) { next(err); }
};

export const getSystemThroughput = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = [];
    const now = new Date();
    
    // Group jobs by hour for the last 24 hours
    for (let i = 24; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(d.getHours() - i);
      const startOfHour = new Date(d.setMinutes(0, 0, 0));
      const endOfHour = new Date(d.setMinutes(59, 59, 999));
      
      const count = await prisma.job.count({
        where: {
          createdAt: { gte: startOfHour, lte: endOfHour }
        }
      });
      
      data.push({
        time: startOfHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        throughput: count
      });
    }
    return sendSuccess(res, 'Throughput retrieved', data);
  } catch (err) { next(err); }
};
