import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendSuccess, sendError } from '../utils/response';
import { env } from '@job-scheduler-system/config';

const prisma = new PrismaClient();

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const updateProfileSchema = z.object({
  name: z.string().optional(),
});

export const updatePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8),
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, 'User already exists', 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { 
        email, 
        passwordHash, 
        name,
        organizationMembers: {
          create: {
            role: 'OWNER',
            organization: {
              create: {
                name: 'Personal Workspace'
              }
            }
          }
        }
      },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, env.JWT_SECRET as string, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return sendSuccess(res, 'User registered successfully', {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    }, undefined, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, env.JWT_SECRET as string, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return sendSuccess(res, 'Login successful', {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, createdAt: true } });
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, 'User details retrieved', user);
  } catch (err) { next(err); }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { name } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { id: true, email: true, name: true }
    });
    return sendSuccess(res, 'Profile updated', user);
  } catch (err) { next(err); }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { oldPassword, newPassword } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return sendError(res, 'User not found', 404);

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) return sendError(res, 'Invalid old password', 400);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
    return sendSuccess(res, 'Password updated');
  } catch (err) { next(err); }
};
