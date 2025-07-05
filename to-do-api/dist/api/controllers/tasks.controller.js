"use strict";
/**
 * Tasks API Controller
 * @fileoverview REST API endpoints for tasks management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksController = void 0;
exports.createTasksController = createTasksController;
/**
 * Controller class for handling tasks API endpoints
 * Handles HTTP requests and responses for task operations
 */
class TasksController {
    constructor(tasksService) {
        this.tasksService = tasksService;
    }
    /**
     * GET /api/lists/:listId/tasks
     * Get all tasks for a specific list
     * @param req - Express request object with user authentication
     * @param res - Express response object
     * @param next - Express next function
     */
    async getListTasks(req, res, next) {
        try {
            const userId = req.userId;
            const listId = req.params.listId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User authentication required'
                    }
                });
                return;
            }
            if (!listId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'List ID is required'
                    }
                });
                return;
            }
            // Parse query parameters for filtering and sorting
            const options = this.parseTaskQueryOptions(req.query);
            const tasks = await this.tasksService.getListTasks(listId, userId, options);
            res.status(200).json({
                success: true,
                data: tasks,
                message: `Retrieved ${tasks.length} tasks`
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/tasks/:id
     * Get a specific task by ID
     * @param req - Express request object with user authentication
     * @param res - Express response object
     * @param next - Express next function
     */
    async getTaskById(req, res, next) {
        try {
            const userId = req.userId;
            const taskId = req.params.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User authentication required'
                    }
                });
                return;
            }
            if (!taskId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Task ID is required'
                    }
                });
                return;
            }
            const task = await this.tasksService.getTaskById(taskId, userId);
            if (!task) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Task not found'
                    }
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: task,
                message: 'Task retrieved successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/lists/:listId/tasks
     * Create a new task in a specific list
     * @param req - Express request object with user authentication
     * @param res - Express response object
     * @param next - Express next function
     */
    async createTask(req, res, next) {
        try {
            const userId = req.userId;
            const listId = req.params.listId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User authentication required'
                    }
                });
                return;
            }
            if (!listId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'List ID is required'
                    }
                });
                return;
            }
            const { title, description, deadline, priority } = req.body;
            // Validate required fields
            if (!title || !title.trim()) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Task title is required'
                    }
                });
                return;
            }
            const taskData = {
                listId,
                userId,
                title: title.trim(),
                description: description?.trim(),
                deadline,
                priority
            };
            const createdTask = await this.tasksService.createTask(taskData);
            res.status(201).json({
                success: true,
                data: createdTask,
                message: 'Task created successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PUT /api/tasks/:id
     * Update an existing task
     * @param req - Express request object with user authentication
     * @param res - Express response object
     * @param next - Express next function
     */
    async updateTask(req, res, next) {
        try {
            const userId = req.userId;
            const taskId = req.params.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User authentication required'
                    }
                });
                return;
            }
            if (!taskId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Task ID is required'
                    }
                });
                return;
            }
            const { title, description, deadline, priority, isCompleted } = req.body;
            // Validate that at least one field is provided
            if (title === undefined && description === undefined && deadline === undefined &&
                priority === undefined && isCompleted === undefined) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'At least one field must be provided for update'
                    }
                });
                return;
            }
            const updates = {};
            if (title !== undefined) {
                updates.title = title?.trim();
            }
            if (description !== undefined) {
                updates.description = description?.trim();
            }
            if (deadline !== undefined) {
                updates.deadline = deadline;
            }
            if (priority !== undefined) {
                updates.priority = priority;
            }
            if (isCompleted !== undefined) {
                updates.isCompleted = isCompleted;
            }
            const updatedTask = await this.tasksService.updateTask(taskId, updates, userId);
            res.status(200).json({
                success: true,
                data: updatedTask,
                message: 'Task updated successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/tasks/:id
     * Delete a task
     * @param req - Express request object with user authentication
     * @param res - Express response object
     * @param next - Express next function
     */
    async deleteTask(req, res, next) {
        try {
            const userId = req.userId;
            const taskId = req.params.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User authentication required'
                    }
                });
                return;
            }
            if (!taskId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Task ID is required'
                    }
                });
                return;
            }
            await this.tasksService.deleteTask(taskId, userId);
            res.status(200).json({
                success: true,
                data: null,
                message: 'Task deleted successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/tasks/:id/complete
     * Mark a task as completed
     * @param req - Express request object with user authentication
     * @param res - Express response object
     * @param next - Express next function
     */
    async markTaskComplete(req, res, next) {
        try {
            const userId = req.userId;
            const taskId = req.params.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User authentication required'
                    }
                });
                return;
            }
            if (!taskId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Task ID is required'
                    }
                });
                return;
            }
            const updatedTask = await this.tasksService.markTaskComplete(taskId, userId);
            res.status(200).json({
                success: true,
                data: updatedTask,
                message: 'Task marked as completed'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/tasks/:id/incomplete
     * Mark a task as incomplete
     * @param req - Express request object with user authentication
     * @param res - Express response object
     * @param next - Express next function
     */
    async markTaskIncomplete(req, res, next) {
        try {
            const userId = req.userId;
            const taskId = req.params.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User authentication required'
                    }
                });
                return;
            }
            if (!taskId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Task ID is required'
                    }
                });
                return;
            }
            const updatedTask = await this.tasksService.markTaskIncomplete(taskId, userId);
            res.status(200).json({
                success: true,
                data: updatedTask,
                message: 'Task marked as incomplete'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/tasks/due-this-week
     * Get tasks due within the current week
     * @param req - Express request object with user authentication
     * @param res - Express response object
     * @param next - Express next function
     */
    async getTasksDueThisWeek(req, res, next) {
        try {
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User authentication required'
                    }
                });
                return;
            }
            const tasks = await this.tasksService.getTasksDueThisWeek(userId);
            res.status(200).json({
                success: true,
                data: tasks,
                message: `Retrieved ${tasks.length} tasks due this week`
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/tasks
     * Get all tasks for the authenticated user with filtering and sorting
     * @param req - Express request object with user authentication
     * @param res - Express response object
     * @param next - Express next function
     */
    async getUserTasks(req, res, next) {
        try {
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User authentication required'
                    }
                });
                return;
            }
            // Parse query parameters for filtering and sorting
            const options = this.parseTaskQueryOptions(req.query);
            const tasks = await this.tasksService.getUserTasks(userId, options);
            res.status(200).json({
                success: true,
                data: tasks,
                message: `Retrieved ${tasks.length} tasks`
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/tasks/sorted-by-deadline
     * Get tasks sorted by deadline with filtering options
     * @param req - Express request object with user authentication
     * @param res - Express response object
     * @param next - Express next function
     */
    async getTasksSortedByDeadline(req, res, next) {
        try {
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User authentication required'
                    }
                });
                return;
            }
            // Parse deadline sort options
            const options = {
                order: req.query.order === 'desc' ? 'desc' : 'asc',
                includeCompleted: req.query.includeCompleted !== 'false',
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset) : undefined
            };
            const tasks = await this.tasksService.getTasksSortedByDeadline(userId, options);
            res.status(200).json({
                success: true,
                data: tasks,
                message: `Retrieved ${tasks.length} tasks sorted by deadline`
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/tasks/statistics
     * Get task statistics for the authenticated user
     * @param req - Express request object with user authentication
     * @param res - Express response object
     * @param next - Express next function
     */
    async getTaskStatistics(req, res, next) {
        try {
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User authentication required'
                    }
                });
                return;
            }
            const statistics = await this.tasksService.getTaskStatistics(userId);
            res.status(200).json({
                success: true,
                data: statistics,
                message: 'Task statistics retrieved successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Parse query parameters into TaskQueryOptions
     * @private
     */
    parseTaskQueryOptions(query) {
        const options = {};
        let hasOptions = false;
        if (query.isCompleted !== undefined) {
            options.isCompleted = query.isCompleted === 'true';
            hasOptions = true;
        }
        if (query.priority && ['low', 'medium', 'high'].includes(query.priority)) {
            options.priority = query.priority;
            hasOptions = true;
        }
        if (query.sortBy && ['createdAt', 'updatedAt', 'deadline', 'title', 'priority'].includes(query.sortBy)) {
            options.sortBy = query.sortBy;
            hasOptions = true;
        }
        if (query.sortOrder && ['asc', 'desc'].includes(query.sortOrder)) {
            options.sortOrder = query.sortOrder;
            hasOptions = true;
        }
        if (query.limit) {
            const limit = parseInt(query.limit);
            if (!isNaN(limit) && limit > 0 && limit <= 100) {
                options.limit = limit;
                hasOptions = true;
            }
        }
        if (query.offset) {
            const offset = parseInt(query.offset);
            if (!isNaN(offset) && offset >= 0) {
                options.offset = offset;
                hasOptions = true;
            }
        }
        return hasOptions ? options : undefined;
    }
}
exports.TasksController = TasksController;
/**
 * Factory function to create tasks controller with dependencies
 * @param tasksService - Tasks service instance
 * @returns Configured tasks controller
 */
function createTasksController(tasksService) {
    return new TasksController(tasksService);
}
