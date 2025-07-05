/**
 * Tasks Routes
 * @fileoverview Express routes for tasks API endpoints
 */

import { Router } from 'express';
import { TasksController } from '../controllers/tasks.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate, taskSchemas } from '../../middleware/validation.middleware';
import { apiRateLimiter } from '../../middleware/rate-limit.middleware';

/**
 * Create tasks routes with all middleware and validation
 * @param tasksController - Tasks controller instance
 * @returns Configured Express router
 */
export function createTasksRoutes(tasksController: TasksController): Router {
  const router = Router();

  // Create middleware stack
  const authStack = [apiRateLimiter, authMiddleware];
  const authValidateStack = (schema: any) => [apiRateLimiter, authMiddleware, validate(schema)];

  // Specific routes first (before parameterized routes)
  router.get('/due-this-week', ...authStack, tasksController.getTasksDueThisWeek.bind(tasksController));
  router.get('/sorted-by-deadline', ...authStack, tasksController.getTasksSortedByDeadline.bind(tasksController));
  router.get('/statistics', ...authStack, tasksController.getTaskStatistics.bind(tasksController));
  
  // General routes
  router.get('/', ...authStack, tasksController.getUserTasks.bind(tasksController));
  
  // Parameterized routes (must be last)
  router.get('/:id', ...authStack, tasksController.getTaskById.bind(tasksController));
  router.put('/:id', ...authValidateStack(taskSchemas.update), tasksController.updateTask.bind(tasksController));
  router.delete('/:id', ...authStack, tasksController.deleteTask.bind(tasksController));
  router.patch('/:id/complete', ...authStack, tasksController.markTaskComplete.bind(tasksController));
  router.patch('/:id/incomplete', ...authStack, tasksController.markTaskIncomplete.bind(tasksController));

  return router;
}