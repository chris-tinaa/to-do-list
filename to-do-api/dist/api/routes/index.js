"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addListsAndTasksRoutes = addListsAndTasksRoutes;
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const lists_routes_1 = require("./lists.routes");
const tasks_routes_1 = require("./tasks.routes");
const list_tasks_routes_1 = require("./list-tasks.routes");
const error_middleware_1 = require("../../middleware/error.middleware");
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: '2025-07-05 15:01:32',
            version: '1.0.0',
            user: 'chris-tinaa',
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        },
        message: 'API is running'
    });
});
// Existing auth routes
router.use('/auth', auth_routes_1.default);
// Function to add lists and tasks routes (to be called from your main app)
function addListsAndTasksRoutes(listsController, tasksController) {
    router.use('/lists', (0, lists_routes_1.createListsRoutes)(listsController));
    router.use('/lists', (0, list_tasks_routes_1.createListTasksRoutes)(tasksController));
    router.use('/tasks', (0, tasks_routes_1.createTasksRoutes)(tasksController));
    // Error handling middleware (should be added last)
    router.use(error_middleware_1.errorMiddleware);
}
exports.default = router;
