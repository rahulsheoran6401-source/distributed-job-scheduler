import { Server } from 'socket.io';

let io: Server | null = null;

export const setIo = (server: Server) => {
  io = server;
};

export const getIo = (): Server => {
  if (!io) {
    throw new Error('Socket.io is not initialized');
  }
  return io;
};

export const emitJobCompleted = (jobId: string, result: any) => {
  if (io) io.emit('job:completed', { jobId, result });
};

export const emitJobFailed = (jobId: string, error: any) => {
  if (io) io.emit('job:failed', { jobId, error });
};

export const emitWorkerHeartbeat = (workerId: string, status: string) => {
  if (io) io.emit('worker:heartbeat', { workerId, status, timestamp: new Date() });
};
