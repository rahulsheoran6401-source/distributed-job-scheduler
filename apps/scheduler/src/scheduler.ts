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
        this.logger.error(err, 'Error in scheduler loop');
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
      this.logger.info(`Promoted ${updated.count} delayed jobs to QUEUED.`);
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
        this.logger.info(`Generated recurring job from definition ${sJob.id}`);
      } catch (err) {
        this.logger.error(err, `Failed to process recurring job ${sJob.id}`);
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
      this.logger.warn(`Worker ${worker.id} (${worker.name}) timed out. Recovering...`);
      
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
      this.logger.info(`Recovered jobs for worker ${worker.id}`);
    }
  }
}
