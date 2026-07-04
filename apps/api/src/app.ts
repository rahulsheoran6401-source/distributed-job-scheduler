import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './logger';
import { correlationIdMiddleware } from './middlewares/correlationId';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(correlationIdMiddleware);
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Health checks
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

app.get('/metrics', (req, res) => {
  // To be implemented: return prometheus metrics
  res.status(200).json({ status: 'metrics' });
});

// v1 routes
import authRouter from './routes/auth.routes';
import { swaggerDocsRouter } from './routes/docs.routes';
import projectRouter from './routes/project.routes';
import queueRouter from './routes/queue.routes';
import jobRouter from './routes/job.routes';
import analyticsRouter from './routes/analytics.routes';
import workerRouter from './routes/worker.routes';
import dlqRouter from './routes/dlq.routes';
import monitoringRouter from './routes/monitoring.routes';
import notificationRouter from './routes/notification.routes';

import { requireAuth } from './middlewares/auth';

import { loadDemoData } from './controllers/demo.controller';

const v1Router = express.Router();
v1Router.use('/auth', authRouter);
v1Router.use('/projects', requireAuth, projectRouter);
v1Router.use('/queues', requireAuth, queueRouter);
v1Router.use('/jobs', requireAuth, jobRouter);
v1Router.use('/analytics', requireAuth, analyticsRouter);
v1Router.use('/workers', requireAuth, workerRouter);
v1Router.use('/dlq', requireAuth, dlqRouter);
v1Router.use('/monitoring', requireAuth, monitoringRouter);
v1Router.use('/notifications', requireAuth, notificationRouter);
v1Router.post('/demo/load', loadDemoData);

import { handleInternalEvent } from './controllers/monitoring.controller';
v1Router.post('/internal/events', handleInternalEvent);

app.use('/api/v1', v1Router);
app.use('/docs', swaggerDocsRouter);

app.use(errorHandler);

export { app };
