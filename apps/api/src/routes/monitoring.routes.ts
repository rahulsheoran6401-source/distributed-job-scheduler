import { Router } from 'express';
import { getMonitoringStatus, handleInternalEvent } from '../controllers/monitoring.controller';

const router = Router();

router.get('/status', getMonitoringStatus);
router.post('/events', handleInternalEvent);

export default router;
