import { Router } from 'express';
import { getFailedJobs, retryFailedJobs, deleteFailedJobs, retryJobsSchema, deleteFailedJobsSchema } from '../controllers/dlq.controller';
import { validate } from '../middlewares/validate';

const router = Router();
router.get('/', getFailedJobs);
router.post('/retry', validate(retryJobsSchema), retryFailedJobs);
router.delete('/', validate(deleteFailedJobsSchema), deleteFailedJobs);

export default router;
