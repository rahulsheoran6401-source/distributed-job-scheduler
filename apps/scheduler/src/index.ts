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
