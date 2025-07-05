"use strict";
/**
 * Tasks Routes
 * @fileoverview Express routes for tasks API endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTasksRoutes = createTasksRoutes;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
/**
 * Create tasks routes with all middleware and validation
 * @param tasksController - Tasks controller instance
 * @returns Configured Express router
 */
function createTasksRoutes(tasksController) {
    const router = (0, express_1.Router)();
    // Create middleware stack
    const authStack = [rate_limit_middleware_1.apiRateLimiter, auth_middleware_1.authMiddleware];
    const authValidateStack = (schema) => [rate_limit_middleware_1.apiRateLimiter, auth_middleware_1.authMiddleware, (0, validation_middleware_1.validate)(schema)];
    // Specific routes first (before parameterized routes)
    router.get('/due-this-week', ...authStack, tasksController.getTasksDueThisWeek.bind(tasksController));
    router.get('/sorted-by-deadline', ...authStack, tasksController.getTasksSortedByDeadline.bind(tasksController));
    router.get('/statistics', ...authStack, tasksController.getTaskStatistics.bind(tasksController));
    // General routes
    router.get('/', ...authStack, tasksController.getUserTasks.bind(tasksController));
    // Parameterized routes (must be last)
    router.get('/:id', ...authStack, tasksController.getTaskById.bind(tasksController));
    router.put('/:id', ...authValidateStack(validation_middleware_1.taskSchemas.update), tasksController.updateTask.bind(tasksController));
    router.delete('/:id', ...authStack, tasksController.deleteTask.bind(tasksController));
    router.patch('/:id/complete', ...authStack, tasksController.markTaskComplete.bind(tasksController));
    router.patch('/:id/incomplete', ...authStack, tasksController.markTaskIncomplete.bind(tasksController));
    return router;
}
