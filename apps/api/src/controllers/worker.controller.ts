import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';

const prisma = new PrismaClient();

const enrichWorkerStats = async (worker: any) => {
  const [running, completed, failed, jobStats, activeQueues] = await Promise.all([
    prisma.job.count({ where: { assignedWorker: worker.id, status: 'RUNNING' } }),
    prisma.job.count({ where: { assignedWorker: worker.id, status: 'COMPLETED' } }),
    prisma.job.count({ where: { assignedWorker: worker.id, status: 'FAILED' } }),
    prisma.job.aggregate({
      where: { assignedWorker: worker.id, status: { in: ['COMPLETED', 'FAILED'] } },
      _sum: { executionDuration: true }
    }),
    prisma.job.findMany({
      where: { assignedWorker: worker.id, status: 'RUNNING' },
      select: { queue: { select: { name: true } } },
      distinct: ['queueId']
    })
  ]);

  return {
    ...worker,
    stats: {
      running,
      completed,
      failed,
      processingTime: jobStats._sum.executionDuration || 0,
      currentQueues: activeQueues.map((q: any) => q.queue.name),
      uptime: Math.max(0, new Date().getTime() - new Date(worker.createdAt).getTime()),
      lastSeen: worker.lastHeartbeat,
      startedAt: worker.createdAt
    }
  };
};

export const getWorkers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workers = await prisma.worker.findMany();
    const enrichedWorkers = await Promise.all(workers.map(enrichWorkerStats));
    return sendSuccess(res, 'Workers retrieved', enrichedWorkers);
  } catch (err) { next(err); }
};

export const getWorkerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const worker = await prisma.worker.findUnique({ where: { id } });
    if (!worker) return sendError(res, 'Worker not found', 404);
    
    const enrichedWorker = await enrichWorkerStats(worker);
    return sendSuccess(res, 'Worker retrieved', enrichedWorker);
  } catch (err) { next(err); }
};

export const drainWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const worker = await prisma.worker.update({ where: { id }, data: { status: 'DRAINING' } });
    return sendSuccess(res, 'Worker draining initiated', worker);
  } catch (err) { next(err); }
};
