import { Router } from 'express';
import { createQueue, getQueues, getQueueById, updateQueue, deleteQueue, pauseQueue, resumeQueue, createQueueSchema, updateQueueSchema } from '../controllers/queue.controller';
import { validate } from '../middlewares/validate';

const router = Router();
router.post('/', validate(createQueueSchema), createQueue);
router.get('/', getQueues);
router.get('/:id', getQueueById);
router.put('/:id', validate(updateQueueSchema), updateQueue);
router.delete('/:id', deleteQueue);
router.post('/:id/pause', pauseQueue);
router.post('/:id/resume', resumeQueue);

export default router;
