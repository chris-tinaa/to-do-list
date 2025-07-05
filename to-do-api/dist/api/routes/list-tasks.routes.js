"use strict";
/**
 * List Tasks Routes
 * @fileoverview Express routes for list-specific task endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createListTasksRoutes = createListTasksRoutes;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
/**
 * Create list tasks routes
 * @param tasksController - Tasks controller instance
 * @returns Configured Express router for list tasks
 */
function createListTasksRoutes(tasksController) {
    const router = (0, express_1.Router)();
    // Create middleware stack
    const authStack = [rate_limit_middleware_1.apiRateLimiter, auth_middleware_1.authMiddleware];
    const authValidateStack = (schema) => [rate_limit_middleware_1.apiRateLimiter, auth_middleware_1.authMiddleware, (0, validation_middleware_1.validate)(schema)];
    // List-specific task routes
    router.get('/:listId/tasks', ...authStack, tasksController.getListTasks.bind(tasksController));
    router.post('/:listId/tasks', ...authValidateStack(validation_middleware_1.taskSchemas.create), tasksController.createTask.bind(tasksController));
    return router;
}
