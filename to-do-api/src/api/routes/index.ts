import { Router } from 'express';
import { createAuthRoutes } from './auth.routes';
import { createListsRoutes } from './lists.routes';
import { createTasksRoutes } from './tasks.routes';
import { createListTasksRoutes } from './list-tasks.routes';
import { AuthController } from '../controllers/auth.controller';
import { ListsController } from '../controllers/lists.controller';
import { TasksController } from '../controllers/tasks.controller';
import { errorMiddleware } from '../../middleware/error.middleware';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: '2025-07-05 15:06:50',
      version: '1.0.0',
      user: 'chris-tinaa',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      features: {
        authentication: true,
        lists: true,
        tasks: true,
        rateLimiting: true,
        validation: true
      }
    },
    message: 'Task Management API is running'
  });
});

// Function to add all routes with controllers
export function addAllRoutes(
  authController: AuthController,
  listsController: ListsController,
  tasksController: TasksController
): void {
  // Auth routes
  router.use('/auth', createAuthRoutes(authController));
  
  // Lists and tasks routes
  router.use('/lists', createListsRoutes(listsController));
  router.use('/lists', createListTasksRoutes(tasksController));
  router.use('/tasks', createTasksRoutes(tasksController));
  
  // Error handling middleware (should be added last)
  router.use(errorMiddleware);
}

export default router;