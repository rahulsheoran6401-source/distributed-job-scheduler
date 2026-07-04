import { Request, Response, NextFunction } from 'express';
import { PrismaClient, JobStatus } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createJobSchema = z.object({
  queueId: z.string().uuid(),
  payload: z.any(),
  priority: z.number().optional(),
  scheduledTime: z.string().datetime().optional(),
  idempotencyKey: z.string().optional(),
  dependencyJobId: z.string().uuid().optional(),
});

export const batchJobSchema = z.object({
  queueId: z.string().uuid(),
  jobs: z.array(z.object({
    payload: z.any(),
    priority: z.number().optional(),
    scheduledTime: z.string().datetime().optional(),
    idempotencyKey: z.string().optional(),
    dependencyJobId: z.string().uuid().optional(),
  }))
});

export const updateDraftJobSchema = z.object({
  payload: z.any().optional(),
  priority: z.number().optional(),
  scheduledTime: z.string().datetime().optional(),
});

export const bulkActionSchema = z.object({
  jobIds: z.array(z.string().uuid())
});

export const createJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const status = data.scheduledTime ? JobStatus.SCHEDULED : JobStatus.QUEUED;
    
    // Check idempotency
    if (data.idempotencyKey) {
      const existing = await prisma.job.findUnique({
        where: { idempotencyKey_queueId: { idempotencyKey: data.idempotencyKey, queueId: data.queueId } }
      });
      if (existing) return sendSuccess(res, 'Job already exists (Idempotent)', existing);
    }

    const job = await prisma.job.create({
      data: { ...data, status }
    });
    return sendSuccess(res, 'Job created', job, undefined, 201);
  } catch (err) { next(err); }
};

export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, queueId, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    if (queueId) where.queueId = queueId;
    if (status) where.status = status;

    const jobs = await prisma.job.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } });
    const total = await prisma.job.count({ where });

    return sendSuccess(res, 'Jobs retrieved', jobs, { total, page: Number(page) });
  } catch (err) { next(err); }
};

export const getJobById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return sendError(res, 'Job not found', 404);
    return sendSuccess(res, 'Job retrieved', job);
  } catch (err) { next(err); }
};

export const cancelJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const job = await prisma.job.update({ where: { id }, data: { status: JobStatus.CANCELLED } });
    return sendSuccess(res, 'Job cancelled', job);
  } catch (err) { next(err); }
};

export const retryJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const job = await prisma.job.update({ where: { id }, data: { status: JobStatus.QUEUED, retryCount: 0 } });
    return sendSuccess(res, 'Job retried', job);
  } catch (err) { next(err); }
};

export const deleteJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.job.delete({ where: { id } });
    return sendSuccess(res, 'Job deleted');
  } catch (err) { next(err); }
};

export const createBatchJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queueId, jobs } = batchJobSchema.parse(req.body);
    const createdJobs = await prisma.$transaction(
      jobs.map(jobData => prisma.job.create({
        data: {
          queueId,
          ...(jobData as any),
          status: jobData.scheduledTime ? JobStatus.SCHEDULED : JobStatus.QUEUED,
        }
      }))
    );
    return sendSuccess(res, 'Batch jobs created', createdJobs, undefined, 201);
  } catch (err) { next(err); }
};

export const cloneJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existingJob = await prisma.job.findUnique({ where: { id } });
    if (!existingJob) return sendError(res, 'Job not found', 404);

    const { id: _, createdAt, updatedAt, startedAt, finishedAt, executionDuration, assignedWorker, ...jobData } = existingJob;
    
    const newJob = await prisma.job.create({
      data: {
        ...(jobData as any),
        status: jobData.scheduledTime ? JobStatus.SCHEDULED : JobStatus.QUEUED,
        idempotencyKey: jobData.idempotencyKey ? `${jobData.idempotencyKey}-clone-${Date.now()}` : null
      }
    });
    
    return sendSuccess(res, 'Job cloned', newJob, undefined, 201);
  } catch (err) { next(err); }
};

export const updateDraftJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateDraftJobSchema.parse(req.body);
    const existingJob = await prisma.job.findUnique({ where: { id } });
    if (!existingJob) return sendError(res, 'Job not found', 404);
    // Assuming Draft jobs have status QUEUED or we can introduce a DRAFT status. Let's just allow editing if it's QUEUED/SCHEDULED.
    if (existingJob.status !== JobStatus.QUEUED && existingJob.status !== JobStatus.SCHEDULED) {
      return sendError(res, 'Can only edit queued or scheduled jobs', 400);
    }
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        ...data,
        ...(data.scheduledTime ? { status: JobStatus.SCHEDULED } : {})
      }
    });
    return sendSuccess(res, 'Job updated', updatedJob);
  } catch (err) { next(err); }
};

export const bulkRetryJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobIds } = bulkActionSchema.parse(req.body);
    await prisma.job.updateMany({
      where: { id: { in: jobIds }, status: JobStatus.FAILED },
      data: { status: JobStatus.QUEUED, retryCount: 0 }
    });
    return sendSuccess(res, 'Jobs bulk retried');
  } catch (err) { next(err); }
};

export const bulkDeleteJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobIds } = bulkActionSchema.parse(req.body);
    await prisma.job.deleteMany({
      where: { id: { in: jobIds } }
    });
    return sendSuccess(res, 'Jobs bulk deleted');
  } catch (err) { next(err); }
};
