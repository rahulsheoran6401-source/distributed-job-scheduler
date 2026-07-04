import { Request, Response, NextFunction } from 'express';
import { PrismaClient, JobStatus } from '@prisma/client';
import { sendSuccess } from '../utils/response';

const prisma = new PrismaClient();

export const loadDemoData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Clean up existing demo data
    await prisma.organization.deleteMany({ where: { name: 'Demo Enterprise' } });
    await prisma.worker.deleteMany({ where: { name: 'demo-worker-1' } });

    // 1. Create Organization & User
    const org = await prisma.organization.create({
      data: {
        name: 'Demo Enterprise',
        members: {
          create: {
            role: 'OWNER',
            user: {
              create: {
                email: 'demo@enterprise.com',
                passwordHash: 'dummy',
                name: 'Demo Admin'
              }
            }
          }
        }
      }
    });

    // 2. Create Projects
    const project1 = await prisma.project.create({
      data: { name: 'Marketing Automation', description: 'Emails and campaigns', organizationId: org.id }
    });
    const project2 = await prisma.project.create({
      data: { name: 'Data Pipeline', description: 'ETL and Analytics', organizationId: org.id }
    });

    // 3. Create Queues
    const queueEmails = await prisma.queue.create({
      data: { name: 'Email Queue', projectId: project1.id, concurrencyLimit: 50, priority: 10 }
    });
    const queueAnalytics = await prisma.queue.create({
      data: { name: 'Analytics Queue', projectId: project2.id, concurrencyLimit: 10, priority: 5 }
    });
    const queueVideo = await prisma.queue.create({
      data: { name: 'Video Processing Queue', projectId: project2.id, concurrencyLimit: 2, priority: 1 }
    });
    const queues = [queueEmails, queueAnalytics, queueVideo];

    // 4. Create Active Worker
    const worker = await prisma.worker.create({
      data: {
        name: 'demo-worker-1',
        status: 'ONLINE',
        lastHeartbeat: new Date(),
        heartbeats: {
          create: [
            { cpuUsage: 45.2, memUsage: 60.1, timestamp: new Date(Date.now() - 10000) },
            { cpuUsage: 48.0, memUsage: 61.0, timestamp: new Date() }
          ]
        }
      }
    });

    // 5. Create 25 Jobs across statuses
    const statuses: JobStatus[] = ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'SCHEDULED', 'DLQ'];
    const jobsData = [];
    
    for (let i = 0; i < 25; i++) {
      const q = queues[i % 3];
      const status = statuses[i % statuses.length];
      
      const isCompleted = status === 'COMPLETED';
      const isRunning = status === 'RUNNING';
      const isFailed = status === 'FAILED' || status === 'DLQ';
      
      const startedAt = (isCompleted || isRunning || isFailed) ? new Date(Date.now() - Math.random() * 60000) : null;
      const finishedAt = (isCompleted || isFailed) ? new Date() : null;
      const executionDuration = finishedAt && startedAt ? finishedAt.getTime() - startedAt.getTime() : null;
      
      jobsData.push({
        queueId: q.id,
        payload: { task: `Demo Task ${i}`, user_id: i },
        status,
        priority: Math.floor(Math.random() * 5),
        assignedWorker: isRunning ? worker.id : null,
        startedAt,
        finishedAt,
        executionDuration
      });
    }

    const createdJobs = await prisma.$transaction(
      jobsData.map(job => prisma.job.create({ data: job }))
    );

    // Create DLQ entries for DLQ jobs
    const dlqJobs = createdJobs.filter((j: any) => j.status === 'DLQ');
    for (const j of dlqJobs) {
      await prisma.deadLetterQueue.create({
        data: {
          jobId: j.id,
          failureReason: 'Connection timeout after 3 retries',
          errorStack: 'Error: Connection timeout\\n  at execute (worker.js:10:5)'
        }
      });
    }

    // 6. Create Notifications
    await prisma.notification.createMany({
      data: [
        { title: 'Worker offline', message: 'Worker node-2 went offline unexpectedly.', type: 'ERROR' },
        { title: 'Queue backlog', message: 'Video Processing Queue is experiencing high backlog.', type: 'WARNING' },
        { title: 'System Updated', message: 'Platform updated to v1.2.0', type: 'INFO' }
      ]
    });

    // 7. Generate some Audit Logs
    await prisma.auditLog.createMany({
      data: [
        { action: 'CREATE_PROJECT', projectId: project1.id },
        { action: 'UPDATE_QUEUE', projectId: project2.id, details: { queue: queueEmails.name } }
      ]
    });

    return sendSuccess(res, 'Enterprise Demo Data loaded successfully', {
      organizationId: org.id,
      projects: 2,
      queues: 3,
      jobs: 25,
      worker: worker.name
    }, undefined, 201);
  } catch (error) {
    next(error);
  }
};
