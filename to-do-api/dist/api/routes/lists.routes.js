"use strict";
/**
 * Lists Routes
 * @fileoverview Express routes for lists API endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createListsRoutes = createListsRoutes;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
/**
 * Create lists routes with all middleware and validation
 * @param listsController - Lists controller instance
 * @returns Configured Express router
 */
function createListsRoutes(listsController) {
    const router = (0, express_1.Router)();
    // Create middleware stack
    const authStack = [rate_limit_middleware_1.apiRateLimiter, auth_middleware_1.authMiddleware];
    const authValidateStack = (schema) => [rate_limit_middleware_1.apiRateLimiter, auth_middleware_1.authMiddleware, (0, validation_middleware_1.validate)(schema)];
    // Routes (specific routes before parameterized ones)
    router.get('/statistics', ...authStack, listsController.getListStatistics.bind(listsController));
    router.get('/', ...authStack, listsController.getLists.bind(listsController));
    router.post('/', ...authValidateStack(validation_middleware_1.listSchemas.create), listsController.createList.bind(listsController));
    router.get('/:id', ...authStack, listsController.getListById.bind(listsController));
    router.put('/:id', ...authValidateStack(validation_middleware_1.listSchemas.update), listsController.updateList.bind(listsController));
    router.delete('/:id', ...authStack, listsController.deleteList.bind(listsController));
    return router;
}
