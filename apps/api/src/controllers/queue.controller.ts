import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createQueueSchema = z.object({
  name: z.string().min(1),
  projectId: z.string().uuid(),
  priority: z.number().optional(),
  concurrencyLimit: z.number().optional(),
});

export const updateQueueSchema = z.object({
  name: z.string().min(1).optional(),
  priority: z.number().optional(),
  concurrencyLimit: z.number().optional(),
});

export const createQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const queue = await prisma.queue.create({ data });
    return sendSuccess(res, 'Queue created', queue, undefined, 201);
  } catch (err) { next(err); }
};

export const getQueues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queues = await prisma.queue.findMany({
      include: {
        project: { select: { name: true } },
        _count: {
          select: { jobs: true }
        }
      }
    });

    const queueStats = await Promise.all(
      queues.map(async (q) => {
        const waiting = await prisma.job.count({ where: { queueId: q.id, status: 'QUEUED' } });
        const active = await prisma.job.count({ where: { queueId: q.id, status: 'RUNNING' } });
        return {
          ...q,
          stats: { waiting, active }
        };
      })
    );

    return sendSuccess(res, 'Queues retrieved', queueStats);
  } catch (err) { next(err); }
};

export const getQueueById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const queue = await prisma.queue.findUnique({ 
      where: { id },
      include: {
        project: { select: { name: true, id: true } }
      }
    });
    if (!queue) return sendError(res, 'Queue not found', 404);
    
    const waiting = await prisma.job.count({ where: { queueId: queue.id, status: 'QUEUED' } });
    const active = await prisma.job.count({ where: { queueId: queue.id, status: 'RUNNING' } });

    return sendSuccess(res, 'Queue retrieved', { ...queue, stats: { waiting, active } });
  } catch (err) { next(err); }
};

export const updateQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const queue = await prisma.queue.update({ where: { id }, data });
    return sendSuccess(res, 'Queue updated', queue);
  } catch (err) { next(err); }
};

export const deleteQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.queue.delete({ where: { id } });
    return sendSuccess(res, 'Queue deleted');
  } catch (err) { next(err); }
};

export const pauseQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const queue = await prisma.queue.update({ where: { id }, data: { isPaused: true } });
    return sendSuccess(res, 'Queue paused', queue);
  } catch (err) { next(err); }
};

export const resumeQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const queue = await prisma.queue.update({ where: { id }, data: { isPaused: false } });
    return sendSuccess(res, 'Queue resumed', queue);
  } catch (err) { next(err); }
};
