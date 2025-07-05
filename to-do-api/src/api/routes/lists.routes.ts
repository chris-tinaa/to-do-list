/**
 * Lists Routes
 * @fileoverview Express routes for lists API endpoints
 */

import { Router } from 'express';
import { ListsController } from '../controllers/lists.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate, listSchemas } from '../../middleware/validation.middleware';
import { apiRateLimiter } from '../../middleware/rate-limit.middleware';

/**
 * Create lists routes with all middleware and validation
 * @param listsController - Lists controller instance
 * @returns Configured Express router
 */
export function createListsRoutes(listsController: ListsController): Router {
  const router = Router();

  // Create middleware stack
  const authStack = [apiRateLimiter, authMiddleware];
  const authValidateStack = (schema: any) => [apiRateLimiter, authMiddleware, validate(schema)];

  // Routes (specific routes before parameterized ones)
  router.get('/statistics', ...authStack, listsController.getListStatistics.bind(listsController));
  router.get('/', ...authStack, listsController.getLists.bind(listsController));
  router.post('/', ...authValidateStack(listSchemas.create), listsController.createList.bind(listsController));
  router.get('/:id', ...authStack, listsController.getListById.bind(listsController));
  router.put('/:id', ...authValidateStack(listSchemas.update), listsController.updateList.bind(listsController));
  router.delete('/:id', ...authStack, listsController.deleteList.bind(listsController));

  return router;
}