const fs = require('fs');
const path = require('path');

const files = {
  // --- PROJECT CONTROLLER & ROUTER ---
  'apps/api/src/controllers/project.controller.ts': `
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  organizationId: z.string().uuid(),
});

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, organizationId } = req.body;
    const project = await prisma.project.create({
      data: { name, description, organizationId },
    });
    return sendSuccess(res, 'Project created', project, undefined, 201);
  } catch (err) { next(err); }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await prisma.project.findMany({ where: { isArchived: false } });
    return sendSuccess(res, 'Projects retrieved', projects);
  } catch (err) { next(err); }
};
  `,
  'apps/api/src/routes/project.routes.ts': `
import { Router } from 'express';
import { createProject, getProjects, createProjectSchema } from '../controllers/project.controller';
import { validate } from '../middlewares/validate';

const router = Router();
router.post('/', validate(createProjectSchema), createProject);
router.get('/', getProjects);

export default router;
  `,

  // --- QUEUE CONTROLLER & ROUTER ---
  'apps/api/src/controllers/queue.controller.ts': `
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/response';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createQueueSchema = z.object({
  name: z.string().min(1),
  projectId: z.string().uuid(),
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
    const queues = await prisma.queue.findMany();
    return sendSuccess(res, 'Queues retrieved', queues);
  } catch (err) { next(err); }
};
  `,
  'apps/api/src/routes/queue.routes.ts': `
import { Router } from 'express';
import { createQueue, getQueues, createQueueSchema } from '../controllers/queue.controller';
import { validate } from '../middlewares/validate';

const router = Router();
router.post('/', validate(createQueueSchema), createQueue);
router.get('/', getQueues);

export default router;
  `,

  // --- JOB CONTROLLER & ROUTER ---
  'apps/api/src/controllers/job.controller.ts': `
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, JobStatus } from '@prisma/client';
import { sendSuccess } from '../utils/response';
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
  `,
  'apps/api/src/routes/job.routes.ts': `
import { Router } from 'express';
import { createJob, getJobs, createJobSchema } from '../controllers/job.controller';
import { validate } from '../middlewares/validate';

const router = Router();
router.post('/', validate(createJobSchema), createJob);
router.get('/', getJobs);

export default router;
  `,

  // --- ANALYTICS CONTROLLER & ROUTER ---
  'apps/api/src/controllers/analytics.controller.ts': `
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/response';

const prisma = new PrismaClient();

export const getSystemMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalJobs, runningJobs, failedJobs, onlineWorkers, queues] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'RUNNING' } }),
      prisma.job.count({ where: { status: 'FAILED' } }),
      prisma.worker.count({ where: { status: 'ONLINE' } }),
      prisma.queue.count()
    ]);
    return sendSuccess(res, 'Metrics retrieved', { totalJobs, runningJobs, failedJobs, onlineWorkers, queues });
  } catch (err) { next(err); }
};
  `,
  'apps/api/src/routes/analytics.routes.ts': `
import { Router } from 'express';
import { getSystemMetrics } from '../controllers/analytics.controller';

const router = Router();
router.get('/metrics', getSystemMetrics);

export default router;
  `
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}
console.log('API components generated.');
