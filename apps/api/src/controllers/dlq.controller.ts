import { Request, Response, NextFunction } from 'express';
import { PrismaClient, JobStatus } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const prisma = new PrismaClient();

export const getFailedJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where = { status: JobStatus.FAILED };
    const jobs = await prisma.job.findMany({ where, skip, take: Number(limit), orderBy: { updatedAt: 'desc' } });
    const total = await prisma.job.count({ where });

    return sendSuccess(res, 'Failed jobs retrieved', jobs, { total, page: Number(page) });
  } catch (err) { next(err); }
};

export const retryJobsSchema = z.object({
  jobIds: z.array(z.string().uuid()),
});

export const retryFailedJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobIds } = req.body;
    await prisma.job.updateMany({
      where: { id: { in: jobIds }, status: JobStatus.FAILED },
      data: { status: JobStatus.QUEUED, retryCount: 0 }
    });
    return sendSuccess(res, 'Jobs retried');
  } catch (err) { next(err); }
};

export const deleteFailedJobsSchema = z.object({
  jobIds: z.array(z.string().uuid()),
});

export const deleteFailedJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobIds } = req.body;
    await prisma.job.deleteMany({
      where: { id: { in: jobIds }, status: JobStatus.FAILED }
    });
    return sendSuccess(res, 'Jobs deleted');
  } catch (err) { next(err); }
};
