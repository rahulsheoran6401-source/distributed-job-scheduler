import { Router } from 'express';
import { getWorkers, getWorkerById, drainWorker } from '../controllers/worker.controller';

const router = Router();
router.get('/', getWorkers);
router.get('/:id', getWorkerById);
router.post('/:id/drain', drainWorker);

export default router;
