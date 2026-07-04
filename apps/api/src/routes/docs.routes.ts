import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { Router } from 'express';

export const swaggerDocsRouter = Router();

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Job Scheduler System API', version: '1.0.0' },
    servers: [{ url: '/api/v1' }],
    paths: {
      '/auth/register': { post: { summary: 'Register', responses: { 201: { description: 'Created' } } } },
      '/auth/login': { post: { summary: 'Login', responses: { 200: { description: 'Success' } } } },
      '/auth/me': { get: { summary: 'Get profile', responses: { 200: { description: 'Success' } } } },
      '/auth/update': { put: { summary: 'Update profile', responses: { 200: { description: 'Success' } } } },
      '/auth/password': { put: { summary: 'Update password', responses: { 200: { description: 'Success' } } } },
      '/projects': { get: { summary: 'List projects' }, post: { summary: 'Create project' } },
      '/projects/{id}': { get: { summary: 'Get project' }, put: { summary: 'Update' }, delete: { summary: 'Delete' } },
      '/queues': { get: { summary: 'List queues' }, post: { summary: 'Create queue' } },
      '/queues/{id}': { get: { summary: 'Get queue' }, put: { summary: 'Update' }, delete: { summary: 'Delete' } },
      '/queues/{id}/pause': { post: { summary: 'Pause' } },
      '/queues/{id}/resume': { post: { summary: 'Resume' } },
      '/jobs': { get: { summary: 'List jobs' }, post: { summary: 'Create job' } },
      '/jobs/batch': { post: { summary: 'Create batch jobs' } },
      '/jobs/{id}': { get: { summary: 'Get job' }, delete: { summary: 'Delete' } },
      '/jobs/{id}/cancel': { post: { summary: 'Cancel' } },
      '/jobs/{id}/retry': { post: { summary: 'Retry' } },
      '/jobs/{id}/clone': { post: { summary: 'Clone' } },
      '/workers': { get: { summary: 'List workers' } },
      '/workers/{id}': { get: { summary: 'Get worker' } },
      '/workers/{id}/drain': { post: { summary: 'Drain worker' } },
      '/dlq': { get: { summary: 'List failed jobs' }, delete: { summary: 'Delete failed' } },
      '/dlq/retry': { post: { summary: 'Retry failed jobs' } },
      '/analytics/metrics': { get: { summary: 'Get metrics' } },
      '/analytics/charts': { get: { summary: 'Get charts' } },
      '/monitoring/status': { get: { summary: 'Get monitoring status' } },
      '/notifications': { get: { summary: 'List notifications' } },
      '/notifications/{id}/read': { put: { summary: 'Mark notification as read' } },
      '/notifications/{id}': { delete: { summary: 'Delete notification' } }
    }
  },
  apis: ['./src/routes/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

swaggerDocsRouter.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
