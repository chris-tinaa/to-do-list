/**
 * List Tasks Routes
 * @fileoverview Express routes for list-specific task endpoints
 */

import { Router } from 'express';
import { TasksController } from '../controllers/tasks.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate, taskSchemas } from '../../middleware/validation.middleware';
import { apiRateLimiter } from '../../middleware/rate-limit.middleware';

/**
 * Create list tasks routes
 * @param tasksController - Tasks controller instance
 * @returns Configured Express router for list tasks
 */
export function createListTasksRoutes(tasksController: TasksController): Router {
  const router = Router();

  // Create middleware stack
  const authStack = [apiRateLimiter, authMiddleware];
  const authValidateStack = (schema: any) => [apiRateLimiter, authMiddleware, validate(schema)];

  // List-specific task routes
  router.get('/:listId/tasks', ...authStack, tasksController.getListTasks.bind(tasksController));
  router.post('/:listId/tasks', ...authValidateStack(taskSchemas.create), tasksController.createTask.bind(tasksController));

  return router;
}