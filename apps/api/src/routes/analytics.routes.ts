import { Router } from 'express';
import { getSystemMetrics, getSystemCharts, getSystemActivity, getSystemThroughput } from '../controllers/analytics.controller';

const router = Router();
router.get('/metrics', getSystemMetrics);
router.get('/charts', getSystemCharts);
router.get('/activity', getSystemActivity);
router.get('/throughput', getSystemThroughput);

export default router;
