import { Router } from 'express';
import { getNotifications, markAsRead, deleteNotification, createNotification } from '../controllers/notification.controller';
import { validate } from '../middlewares/validate';
import { createNotificationSchema } from '../controllers/notification.controller';

const router = Router();

router.get('/', getNotifications);
router.post('/', validate(createNotificationSchema), createNotification);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
