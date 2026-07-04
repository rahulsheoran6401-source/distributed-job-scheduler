import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const prisma = new PrismaClient();

import { AuthRequest } from '../middlewares/auth';

export const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  organizationId: z.string().uuid().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, organizationId } = req.body;
    let finalOrgId = organizationId;

    if (!finalOrgId) {
      const member = await prisma.organizationMember.findFirst({
        where: { userId: req.user!.userId }
      });
      if (!member) return sendError(res, 'User does not belong to any organization', 400);
      finalOrgId = member.organizationId;
    }

    const project = await prisma.project.create({
      data: { name, description, organizationId: finalOrgId },
    });
    return sendSuccess(res, 'Project created', project, undefined, 201);
  } catch (err) {
    console.error("Create Project Error:", err);
    next(err);
  }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await prisma.project.findMany({ where: { isArchived: false } });
    return sendSuccess(res, 'Projects retrieved', projects);
  } catch (err) { next(err); }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return sendError(res, 'Project not found', 404);
    return sendSuccess(res, 'Project retrieved', project);
  } catch (err) { next(err); }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id },
      data: { name, description },
    });
    return sendSuccess(res, 'Project updated', project);
  } catch (err) { next(err); }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    return sendSuccess(res, 'Project deleted');
  } catch (err) { next(err); }
};
