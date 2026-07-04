import { app } from './app';
import { env } from '@job-scheduler-system/config';
import { logger } from './logger';
import { Server } from 'socket.io';
import { setIo } from './services/socket';

const start = () => {
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 API Server running on http://localhost:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  const io = new Server(server, {
    cors: { origin: '*' }
  });
  
  setIo(io);

  io.on('connection', (socket) => {
    logger.info(`WebSocket connected: ${socket.id}`);
    socket.on('disconnect', () => {
      logger.info(`WebSocket disconnected: ${socket.id}`);
    });
  });

  const gracefulShutdown = () => {
    logger.info('Shutting down API server gracefully...');
    server.close(() => {
      logger.info('API server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

start();
