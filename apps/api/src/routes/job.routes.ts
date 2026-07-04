import { Router } from 'express';
import { createJob, getJobs, getJobById, cancelJob, retryJob, deleteJob, createBatchJobs, cloneJob, createJobSchema, updateDraftJobSchema, bulkActionSchema, updateDraftJob, bulkRetryJobs, bulkDeleteJobs } from '../controllers/job.controller';
import { validate } from '../middlewares/validate';

const router = Router();
router.post('/', validate(createJobSchema), createJob);
router.post('/batch', createBatchJobs);
router.get('/', getJobs);
router.get('/:id', getJobById);
router.put('/:id', validate(updateDraftJobSchema), updateDraftJob);
router.post('/:id/cancel', cancelJob);
router.post('/:id/retry', retryJob);
router.post('/:id/clone', cloneJob);
router.delete('/:id', deleteJob);
router.post('/bulk-retry', validate(bulkActionSchema), bulkRetryJobs);
router.post('/bulk-delete', validate(bulkActionSchema), bulkDeleteJobs);

export default router;
