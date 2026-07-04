import { WorkerService } from './worker';
import { env } from '@job-scheduler-system/config';
import pino from 'pino';

const logger = pino({ level: env.NODE_ENV === 'production' ? 'info' : 'debug' });
import os from 'os';
const workerName = `worker-${os.hostname()}`;

const worker = new WorkerService(workerName, logger);

const start = async () => {
  logger.info(`🚀 Starting worker ${workerName}`);
  await worker.start();
};

start().catch(err => {
  logger.error(err);
  process.exit(1);
});
