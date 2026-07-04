import { PrismaClient, JobStatus, WorkerStatus } from '@prisma/client';
import { Logger } from 'pino';

const prisma = new PrismaClient();

export class WorkerService {
  private isRunning = false;
  private workerId: string | null = null;

  constructor(private readonly name: string, private readonly logger: Logger) {}

  private async emitEvent(event: string, payload: any) {
    try {
      await fetch('http://localhost:3000/api/v1/internal/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, payload }),
      });
    } catch (err) {
      this.logger.error(err, 'Failed to emit internal event to API');
    }
  }

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
    const now = new Date();
    const worker = await prisma.worker.upsert({
      where: { name: this.name },
      update: { status: WorkerStatus.ONLINE, lastHeartbeat: now },
      create: { name: this.name, status: WorkerStatus.ONLINE, lastHeartbeat: now },
    });
    this.workerId = worker.id;
    this.logger.info(`Registered worker ${this.name} with ID ${this.workerId}`);
  }

  private startHeartbeat() {
    const sendHeartbeat = async () => {
      if (!this.isRunning || !this.workerId) return;
      try {
        await prisma.worker.update({
          where: { id: this.workerId },
          data: { lastHeartbeat: new Date() },
        });
        await prisma.workerHeartbeat.create({
          data: { workerId: this.workerId, timestamp: new Date() },
        });
        await this.emitEvent('worker:heartbeat', { workerId: this.workerId, status: 'ONLINE', timestamp: new Date() });
      } catch (err) {
        this.logger.error(err, 'Failed to send heartbeat');
      }
    };
    
    // Send first heartbeat immediately, then every 5 seconds
    sendHeartbeat();
    setInterval(sendHeartbeat, 5000);
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
        this.logger.error(err, 'Error in poll loop');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async claimNextJob() {
    // strict deterministic ordering: Queue Priority -> Job Priority -> Scheduled Execution Time -> FIFO
    const jobs = await prisma.$queryRaw<any[]>`
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
    `;

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
    this.logger.info(`Executing job ${job.id}`);
    const startedAt = new Date();
    await prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.RUNNING, startedAt },
    });
    await this.emitEvent('job:started', { jobId: job.id, workerId: this.workerId });

    try {
      // Simulate job execution
      this.logger.debug(`Payload: ${JSON.stringify(job.payload)}`);
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
      await this.emitEvent('job:completed', { jobId: job.id, result: 'Success' });
      this.logger.info(`Job ${job.id} completed successfully.`);
    } catch (err: any) {
      this.logger.error(`Job ${job.id} failed`, err);
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
      this.logger.info(`Job ${job.id} moved to DLQ.`);
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
      this.logger.info(`Job ${job.id} queued for retry (${job.retryCount + 1}/${maxRetries}).`);
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
    await this.emitEvent('job:failed', { jobId: job.id, error: error.message || 'Unknown error' });
  }
}
