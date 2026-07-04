import { Request, Response, NextFunction } from 'express';
import os from 'os';
import { sendSuccess } from '../utils/response';
import { HealthService } from '../services/health.service';

export const getMonitoringStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => acc + cpu.times.user + cpu.times.sys, 0) / 
      cpus.reduce((acc, cpu) => acc + cpu.times.user + cpu.times.sys + cpu.times.idle, 0) * 100;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsage = (usedMem / totalMem) * 100;

    const healthStatus = await HealthService.getHealthStatus();

    const status = {
      cpu: cpuUsage.toFixed(2) + '%',
      ram: ramUsage.toFixed(2) + '%',
      postgres: { status: healthStatus.details.database ? 'ok' : 'error', latency: 5 },
      redis: { status: healthStatus.details.redis ? 'ok' : 'error', latency: 2 },
      scheduler: { status: healthStatus.details.scheduler ? 'ok' : 'error' },
      worker: { status: healthStatus.details.workers ? 'ok' : 'error' },
      api: { status: healthStatus.details.api ? 'ok' : 'error' },
      overall: healthStatus.status
    };

    return sendSuccess(res, 'Monitoring status retrieved', status);
  } catch (err) { next(err); }
};

export const handleInternalEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event, payload } = req.body;
    const { getIo } = require('../services/socket');
    const io = getIo();
    if (io) {
      io.emit(event, payload);
    }
    return sendSuccess(res, 'Event broadcasted successfully');
  } catch (err) {
    next(err);
  }
};
