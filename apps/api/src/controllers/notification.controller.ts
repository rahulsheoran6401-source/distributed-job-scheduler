import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';
import { getIo } from '../services/socket';

const prisma = new PrismaClient();

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, isRead } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const notifications = await prisma.notification.findMany({ 
      where, 
      skip, 
      take: Number(limit), 
      orderBy: { createdAt: 'desc' } 
    });
    const total = await prisma.notification.count({ where });

    return sendSuccess(res, 'Notifications retrieved', notifications, { total, page: Number(page) });
  } catch (err) { next(err); }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    return sendSuccess(res, 'Notification marked as read', notification);
  } catch (err) { next(err); }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.notification.delete({ where: { id } });
    return sendSuccess(res, 'Notification deleted');
  } catch (err) { next(err); }
};

export const createNotificationSchema = z.object({
  title: z.string(),
  message: z.string(),
  type: z.string(),
});

export const createNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createNotificationSchema.parse(req.body);
    const notification = await prisma.notification.create({ data });
    
    // Emit socket event
    const io = getIo();
    if (io) {
      io.emit('notification:new', notification);
    }
    
    return sendSuccess(res, 'Notification created', notification, undefined, 201);
  } catch (err) { next(err); }
};
