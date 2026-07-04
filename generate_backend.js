const fs = require('fs');
const path = require('path');

const files = {
  // --- WORKER ---
  'apps/worker/src/index.ts': `
import { WorkerService } from './worker';
import { env } from '@job-scheduler-system/config';
import pino from 'pino';

const logger = pino({ level: env.NODE_ENV === 'production' ? 'info' : 'debug' });
const workerName = \`worker-\${process.pid}\`;

const worker = new WorkerService(workerName, logger);

const start = async () => {
  logger.info(\`🚀 Starting worker \${workerName}\`);
  await worker.start();
};

start().catch(err => {
  logger.error(err);
  process.exit(1);
});
  `,
  'apps/worker/src/worker.ts': `
import { PrismaClient, JobStatus, WorkerStatus } from '@prisma/client';
import { Logger } from 'pino';

const prisma = new PrismaClient();

export class WorkerService {
  private isRunning = false;
  private workerId: string | null = null;

  constructor(private readonly name: string, private readonly logger: Logger) {}

  async start() {
    this.isRunning = true;
    await this.registerWorker();
    this.startHeartbeat();
    this.pollLoop();
  }

  async stop() {
    this.isRunning = false;
    if (this.workerId) {
      await prisma.worker.update({
        where: { id: this.workerId },
        data: { status: WorkerStatus.OFFLINE },
      });
    }
  }

  private async registerWorker() {
    const worker = await prisma.worker.upsert({
      where: { name: this.name },
      update: { status: WorkerStatus.ONLINE, lastHeartbeat: new Date() },
      create: { name: this.name, status: WorkerStatus.ONLINE },
    });
    this.workerId = worker.id;
    this.logger.info(\`Registered worker \${this.name} with ID \${this.workerId}\`);
  }

  private startHeartbeat() {
    setInterval(async () => {
      if (!this.isRunning || !this.workerId) return;
      try {
        await prisma.worker.update({
          where: { id: this.workerId },
          data: { lastHeartbeat: new Date() },
        });
        await prisma.workerHeartbeat.create({
          data: { workerId: this.workerId, timestamp: new Date() },
        });
      } catch (err) {
        this.logger.error('Failed to send heartbeat', err);
      }
    }, 15000); // 15 seconds
  }

  private async pollLoop() {
    while (this.isRunning) {
      try {
        const job = await this.claimNextJob();
        if (job) {
          await this.executeJob(job);
        } else {
          // Exponential backoff or sleep when queue is empty
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err) {
        this.logger.error('Error in poll loop', err);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async claimNextJob() {
    // strict deterministic ordering: Queue Priority -> Job Priority -> Scheduled Execution Time -> FIFO
    const jobs = await prisma.$queryRaw<any[]>\`
      SELECT j.* 
      FROM "Job" j
      JOIN "Queue" q ON j."queueId" = q.id
      WHERE j.status = 'QUEUED' 
        AND (j."scheduledTime" IS NULL OR j."scheduledTime" <= NOW())
        AND q."isPaused" = false
        AND q."isDisabled" = false
      ORDER BY 
        q.priority DESC, 
        j.priority DESC, 
        j."scheduledTime" ASC NULLS FIRST,
        j."createdAt" ASC
      LIMIT 1 
      FOR UPDATE SKIP LOCKED
    \`;

    if (jobs.length === 0) return null;

    const job = jobs[0];
    const claimedJob = await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.CLAIMED,
        assignedWorker: this.workerId,
      },
    });

    return claimedJob;
  }

  private async executeJob(job: any) {
    this.logger.info(\`Executing job \${job.id}\`);
    const startedAt = new Date();
    await prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.RUNNING, startedAt },
    });

    try {
      // Simulate job execution
      this.logger.debug(\`Payload: \${JSON.stringify(job.payload)}\`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulating work
      
      const finishedAt = new Date();
      const duration = finishedAt.getTime() - startedAt.getTime();

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.COMPLETED,
          finishedAt,
          executionDuration: duration,
        },
      });

      await prisma.jobExecution.create({
        data: {
          jobId: job.id,
          workerId: this.workerId,
          status: JobStatus.COMPLETED,
          retryCount: job.retryCount,
          duration,
          startedAt,
          finishedAt,
        },
      });
      this.logger.info(\`Job \${job.id} completed successfully.\`);
    } catch (err: any) {
      this.logger.error(\`Job \${job.id} failed\`, err);
      // Handle failure / retries / DLQ
      await this.handleJobFailure(job, err, startedAt);
    }
  }

  private async handleJobFailure(job: any, error: any, startedAt: Date) {
    const finishedAt = new Date();
    const duration = finishedAt.getTime() - startedAt.getTime();
    const maxRetries = job.retryPolicy?.maxRetries || 3; // Simplified
    
    if (job.retryCount >= maxRetries) {
      // Move to DLQ
      await prisma.$transaction([
        prisma.job.update({
          where: { id: job.id },
          data: { status: JobStatus.DLQ, finishedAt, executionDuration: duration },
        }),
        prisma.deadLetterQueue.create({
          data: {
            jobId: job.id,
            failureReason: error.message || 'Unknown error',
            errorStack: error.stack,
          },
        }),
      ]);
      this.logger.info(\`Job \${job.id} moved to DLQ.\`);
    } else {
      // Retry
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.QUEUED,
          retryCount: job.retryCount + 1,
          scheduledTime: new Date(Date.now() + 5000), // Simple 5s delay backoff
        },
      });
      this.logger.info(\`Job \${job.id} queued for retry (\${job.retryCount + 1}/\${maxRetries}).\`);
    }

    await prisma.jobExecution.create({
      data: {
        jobId: job.id,
        workerId: this.workerId,
        status: JobStatus.FAILED,
        error: error.message || 'Unknown error',
        errorStack: error.stack,
        retryCount: job.retryCount,
        duration,
        startedAt,
        finishedAt,
      },
    });
  }
}
  `,

  // --- SCHEDULER ---
  'apps/scheduler/src/index.ts': `
import { SchedulerService } from './scheduler';
import { env } from '@job-scheduler-system/config';
import pino from 'pino';

const logger = pino({ level: env.NODE_ENV === 'production' ? 'info' : 'debug' });
const scheduler = new SchedulerService(logger);

const start = async () => {
  logger.info('🚀 Starting Scheduler Service');
  await scheduler.start();
};

start().catch(err => {
  logger.error(err);
  process.exit(1);
});
  `,
  'apps/scheduler/src/scheduler.ts': `
import { PrismaClient, JobStatus, WorkerStatus } from '@prisma/client';
import { Logger } from 'pino';
import cronParser from 'cron-parser';

const prisma = new PrismaClient();

export class SchedulerService {
  private isRunning = false;

  constructor(private readonly logger: Logger) {}

  async start() {
    this.isRunning = true;
    this.runLoop();
  }

  async stop() {
    this.isRunning = false;
  }

  private async runLoop() {
    while (this.isRunning) {
      try {
        await this.promoteDelayedJobs();
        await this.processRecurringJobs();
        await this.recoverCrashedWorkers();
      } catch (err) {
        this.logger.error('Error in scheduler loop', err);
      }
      await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10s
    }
  }

  private async promoteDelayedJobs() {
    // PostgreSQL uses NOW() to easily query scheduled jobs, so this is mostly handled
    // by the Worker polling loop which filters scheduledTime <= NOW().
    // However, if we need state transitions (SCHEDULED -> QUEUED):
    const updated = await prisma.job.updateMany({
      where: {
        status: JobStatus.SCHEDULED,
        scheduledTime: { lte: new Date() },
      },
      data: {
        status: JobStatus.QUEUED,
      },
    });
    if (updated.count > 0) {
      this.logger.info(\`Promoted \${updated.count} delayed jobs to QUEUED.\`);
    }
  }

  private async processRecurringJobs() {
    const now = new Date();
    const scheduledJobs = await prisma.scheduledJob.findMany({
      where: {
        OR: [
          { nextRunAt: { lte: now } },
          { nextRunAt: null }
        ]
      },
    });

    for (const sJob of scheduledJobs) {
      try {
        const interval = cronParser.parseExpression(sJob.cronExpression);
        const nextRun = interval.next().toDate();

        await prisma.$transaction([
          prisma.job.create({
            data: {
              queueId: sJob.queueId,
              payload: sJob.payload || {},
              priority: sJob.priority,
              status: JobStatus.QUEUED,
              retryPolicy: sJob.retryPolicy || undefined,
              tags: sJob.tags,
            },
          }),
          prisma.scheduledJob.update({
            where: { id: sJob.id },
            data: { lastRunAt: now, nextRunAt: nextRun },
          }),
        ]);
        this.logger.info(\`Generated recurring job from definition \${sJob.id}\`);
      } catch (err) {
        this.logger.error(\`Failed to process recurring job \${sJob.id}\`, err);
      }
    }
  }

  private async recoverCrashedWorkers() {
    const timeoutThreshold = new Date(Date.now() - 60000); // 1 minute without heartbeat
    const crashedWorkers = await prisma.worker.findMany({
      where: {
        status: WorkerStatus.ONLINE,
        lastHeartbeat: { lt: timeoutThreshold },
      },
    });

    for (const worker of crashedWorkers) {
      this.logger.warn(\`Worker \${worker.id} (\${worker.name}) timed out. Recovering...\`);
      
      // Mark offline and requeue its running jobs
      await prisma.$transaction([
        prisma.worker.update({
          where: { id: worker.id },
          data: { status: WorkerStatus.OFFLINE },
        }),
        prisma.job.updateMany({
          where: { assignedWorker: worker.id, status: JobStatus.RUNNING },
          data: { status: JobStatus.QUEUED, assignedWorker: null },
        }),
      ]);
      this.logger.info(\`Recovered jobs for worker \${worker.id}\`);
    }
  }
}
  `
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}
console.log('Worker and Scheduler code generated.');
