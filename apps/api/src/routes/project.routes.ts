import { Router } from 'express';
import { createProject, getProjects, getProjectById, updateProject, deleteProject, createProjectSchema, updateProjectSchema } from '../controllers/project.controller';
import { validate } from '../middlewares/validate';

const router = Router();
router.post('/', validate(createProjectSchema), createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;
