"use strict";
/**
 * Tasks Service
 * @fileoverview Business logic layer for tasks management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const errors_1 = require("../utils/errors");
/**
 * Service class for handling tasks business logic
 * Provides validation, business rules, and orchestration between API and repository layers
 */
class TasksService {
    constructor(tasksRepository, listsRepository) {
        this.tasksRepository = tasksRepository;
        this.listsRepository = listsRepository;
    }
    /**
     * Create a new task with validation and business rules
     * @param taskData - The task creation data
     * @returns Promise resolving to the created task
     * @throws {ValidationError} When input data is invalid
     * @throws {NotFoundError} When list doesn't exist
     * @throws {CustomError} When creation fails
     */
    async createTask(taskData) {
        try {
            // Business validation
            this.validateCreateTaskInput(taskData);
            // Verify list exists and user owns it
            await this.verifyListOwnership(taskData.listId, taskData.userId);
            // Additional business rules
            await this.enforceTaskCreationRules(taskData);
            // Create the task
            const createdTask = await this.tasksRepository.create(taskData);
            return this.enrichTaskData(createdTask);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to create task', 500);
        }
    }
    /**
     * Get all tasks for a list with filtering options
     * @param listId - The ID of the list
     * @param userId - The ID of the user
     * @param options - Optional filtering and sorting options
     * @returns Promise resolving to array of tasks
     * @throws {ValidationError} When parameters are invalid
     * @throws {NotFoundError} When list doesn't exist
     * @throws {CustomError} When retrieval fails
     */
    async getListTasks(listId, userId, options) {
        try {
            if (!listId || !listId.trim()) {
                throw new errors_1.ValidationError('List ID is required');
            }
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            // Verify list exists and user owns it
            await this.verifyListOwnership(listId, userId);
            // Get tasks from repository
            let tasks;
            if (options && Object.keys(options).length > 0) {
                // Use the general findByUserId with list filter for advanced options
                const allUserTasks = await this.tasksRepository.findByUserId(userId, options);
                tasks = allUserTasks.filter(task => task.listId === listId);
            }
            else {
                tasks = await this.tasksRepository.findByListId(listId, userId);
            }
            return tasks.map(task => this.enrichTaskData(task));
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve list tasks', 500);
        }
    }
    /**
     * Get all tasks for a user with filtering options
     * @param userId - The ID of the user
     * @param options - Optional filtering and sorting options
     * @returns Promise resolving to array of tasks
     * @throws {ValidationError} When userId is invalid
     * @throws {CustomError} When retrieval fails
     */
    async getUserTasks(userId, options) {
        try {
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const tasks = await this.tasksRepository.findByUserId(userId, options);
            return tasks.map(task => this.enrichTaskData(task));
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve user tasks', 500);
        }
    }
    /**
     * Get a specific task by ID with user ownership verification
     * @param taskId - The ID of the task
     * @param userId - The ID of the user
     * @returns Promise resolving to the task or null if not found
     * @throws {ValidationError} When parameters are invalid
     * @throws {CustomError} When user doesn't own the task
     * @throws {CustomError} When retrieval fails
     */
    async getTaskById(taskId, userId) {
        try {
            if (!taskId || !taskId.trim()) {
                throw new errors_1.ValidationError('Task ID is required');
            }
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const task = await this.tasksRepository.findById(taskId, userId);
            if (!task) {
                return null;
            }
            return this.enrichTaskData(task);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve task', 500);
        }
    }
    /**
     * Update an existing task with validation and business rules
     * @param taskId - The ID of the task to update
     * @param updates - The updates to apply
     * @param userId - The ID of the user making the update
     * @returns Promise resolving to the updated task
     * @throws {ValidationError} When input data is invalid
     * @throws {NotFoundError} When task doesn't exist
     * @throws {CustomError} When user doesn't own the task
     * @throws {CustomError} When update fails
     */
    async updateTask(taskId, updates, userId) {
        try {
            // Validate input parameters
            if (!taskId || !taskId.trim()) {
                throw new errors_1.ValidationError('Task ID is required');
            }
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            // Business validation
            this.validateUpdateTaskInput(updates);
            // Check if task exists and user owns it
            const existingTask = await this.tasksRepository.findById(taskId, userId);
            if (!existingTask) {
                throw new errors_1.NotFoundError('Task not found or you do not have permission to update it');
            }
            // Additional business rules for updates
            await this.enforceTaskUpdateRules(existingTask, updates);
            // Perform the update
            const updatedTask = await this.tasksRepository.update(taskId, updates, userId);
            return this.enrichTaskData(updatedTask);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to update task', 500);
        }
    }
    /**
     * Delete a task with user ownership verification
     * @param taskId - The ID of the task to delete
     * @param userId - The ID of the user making the deletion
     * @returns Promise resolving when deletion is complete
     * @throws {ValidationError} When parameters are invalid
     * @throws {NotFoundError} When task doesn't exist
     * @throws {CustomError} When user doesn't own the task
     * @throws {CustomError} When deletion fails
     */
    async deleteTask(taskId, userId) {
        try {
            // Validate input parameters
            if (!taskId || !taskId.trim()) {
                throw new errors_1.ValidationError('Task ID is required');
            }
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            // Check if task exists and user owns it
            const existingTask = await this.tasksRepository.findById(taskId, userId);
            if (!existingTask) {
                throw new errors_1.NotFoundError('Task not found or you do not have permission to delete it');
            }
            // Business rule validation for deletion
            await this.validateTaskDeletion(existingTask);
            // Perform the deletion
            await this.tasksRepository.delete(taskId, userId);
            // Log the deletion for audit purposes
            this.logTaskDeletion(existingTask, userId);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to delete task', 500);
        }
    }
    /**
     * Mark a task as completed
     * @param taskId - The ID of the task to mark as completed
     * @param userId - The ID of the user making the change
     * @returns Promise resolving to the updated task
     * @throws {ValidationError} When parameters are invalid
     * @throws {NotFoundError} When task doesn't exist
     * @throws {CustomError} When user doesn't own the task
     * @throws {CustomError} When update fails
     */
    async markTaskComplete(taskId, userId) {
        try {
            // Validate input parameters
            if (!taskId || !taskId.trim()) {
                throw new errors_1.ValidationError('Task ID is required');
            }
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            // Check if task exists and user owns it
            const existingTask = await this.tasksRepository.findById(taskId, userId);
            if (!existingTask) {
                throw new errors_1.NotFoundError('Task not found or you do not have permission to update it');
            }
            // Business rules for completion
            if (existingTask.isCompleted) {
                throw new errors_1.ValidationError('Task is already completed');
            }
            // Mark as complete
            const updatedTask = await this.tasksRepository.markComplete(taskId, userId);
            return this.enrichTaskData(updatedTask);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to mark task as complete', 500);
        }
    }
    /**
     * Mark a task as incomplete
     * @param taskId - The ID of the task to mark as incomplete
     * @param userId - The ID of the user making the change
     * @returns Promise resolving to the updated task
     * @throws {ValidationError} When parameters are invalid
     * @throws {NotFoundError} When task doesn't exist
     * @throws {CustomError} When user doesn't own the task
     * @throws {CustomError} When update fails
     */
    async markTaskIncomplete(taskId, userId) {
        try {
            // Validate input parameters
            if (!taskId || !taskId.trim()) {
                throw new errors_1.ValidationError('Task ID is required');
            }
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            // Check if task exists and user owns it
            const existingTask = await this.tasksRepository.findById(taskId, userId);
            if (!existingTask) {
                throw new errors_1.NotFoundError('Task not found or you do not have permission to update it');
            }
            // Business rules for incompletion
            if (!existingTask.isCompleted) {
                throw new errors_1.ValidationError('Task is already incomplete');
            }
            // Mark as incomplete
            const updatedTask = await this.tasksRepository.markIncomplete(taskId, userId);
            return this.enrichTaskData(updatedTask);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to mark task as incomplete', 500);
        }
    }
    /**
     * Get tasks due within the current week for a user
     * @param userId - The ID of the user
     * @returns Promise resolving to array of tasks due this week
     * @throws {ValidationError} When userId is invalid
     * @throws {CustomError} When retrieval fails
     */
    async getTasksDueThisWeek(userId) {
        try {
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const tasks = await this.tasksRepository.findDueThisWeek(userId);
            return tasks.map(task => this.enrichTaskData(task));
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve tasks due this week', 500);
        }
    }
    /**
     * Get tasks sorted by deadline with additional filtering
     * @param userId - The ID of the user
     * @param options - Sorting and filtering options
     * @returns Promise resolving to array of sorted tasks
     * @throws {ValidationError} When userId is invalid
     * @throws {CustomError} When retrieval fails
     */
    async getTasksSortedByDeadline(userId, options) {
        try {
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const queryOptions = {
                sortBy: 'deadline',
                sortOrder: options?.order || 'asc',
                isCompleted: options?.includeCompleted === false ? false : undefined,
                limit: options?.limit,
                offset: options?.offset
            };
            const tasks = await this.tasksRepository.findByUserId(userId, queryOptions);
            return tasks.map(task => this.enrichTaskData(task));
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve tasks sorted by deadline', 500);
        }
    }
    /**
     * Get task statistics for a user
     * @param userId - The ID of the user
     * @returns Promise resolving to task statistics
     * @throws {ValidationError} When userId is invalid
     * @throws {CustomError} When retrieval fails
     */
    async getTaskStatistics(userId) {
        try {
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const totalTasks = await this.tasksRepository.countByUserId(userId);
            const completedTasks = await this.tasksRepository.countCompletedByUserId(userId);
            const pendingTasks = totalTasks - completedTasks;
            // Get tasks due this week
            const dueThisWeek = await this.tasksRepository.findDueThisWeek(userId);
            // Calculate overdue tasks
            const now = new Date();
            const allTasks = await this.tasksRepository.findByUserId(userId, { isCompleted: false });
            const overdueTasks = allTasks.filter(task => task.deadline && new Date(task.deadline) < now).length;
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            return {
                totalTasks,
                completedTasks,
                pendingTasks,
                overdueTasks,
                dueThisWeek: dueThisWeek.length,
                completionRate: Math.round(completionRate * 100) / 100,
                tasksWithDeadlines: allTasks.filter(task => task.deadline).length,
                highPriorityTasks: allTasks.filter(task => task.priority === 'high').length
            };
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve task statistics', 500);
        }
    }
    /**
     * Validate create task input
     * @private
     */
    validateCreateTaskInput(taskData) {
        if (!taskData.title || !taskData.title.trim()) {
            throw new errors_1.ValidationError('Task title is required');
        }
        if (!taskData.listId || !taskData.listId.trim()) {
            throw new errors_1.ValidationError('List ID is required');
        }
        if (!taskData.userId || !taskData.userId.trim()) {
            throw new errors_1.ValidationError('User ID is required');
        }
        if (taskData.title.trim().length > 200) {
            throw new errors_1.ValidationError('Task title cannot exceed 200 characters');
        }
        if (taskData.description && taskData.description.length > 1000) {
            throw new errors_1.ValidationError('Task description cannot exceed 1000 characters');
        }
        if (taskData.deadline) {
            this.validateDeadline(taskData.deadline);
        }
        if (taskData.priority && !['low', 'medium', 'high'].includes(taskData.priority)) {
            throw new errors_1.ValidationError('Priority must be low, medium, or high');
        }
    }
    /**
     * Validate update task input
     * @private
     */
    validateUpdateTaskInput(updates) {
        if (updates.title !== undefined) {
            if (!updates.title || !updates.title.trim()) {
                throw new errors_1.ValidationError('Task title cannot be empty');
            }
            if (updates.title.trim().length > 200) {
                throw new errors_1.ValidationError('Task title cannot exceed 200 characters');
            }
        }
        if (updates.description !== undefined && updates.description && updates.description.length > 1000) {
            throw new errors_1.ValidationError('Task description cannot exceed 1000 characters');
        }
        if (updates.deadline !== undefined && updates.deadline) {
            this.validateDeadline(updates.deadline);
        }
        if (updates.priority !== undefined && updates.priority && !['low', 'medium', 'high'].includes(updates.priority)) {
            throw new errors_1.ValidationError('Priority must be low, medium, or high');
        }
        // Ensure at least one field is being updated
        const hasUpdates = updates.title !== undefined ||
            updates.description !== undefined ||
            updates.deadline !== undefined ||
            updates.priority !== undefined ||
            updates.isCompleted !== undefined;
        if (!hasUpdates) {
            throw new errors_1.ValidationError('At least one field must be provided for update');
        }
    }
    /**
     * Validate deadline format and business rules
     * @private
     */
    validateDeadline(deadline) {
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
            throw new errors_1.ValidationError('Invalid deadline format. Use ISO 8601 format');
        }
        // Business rule: deadline cannot be in the past (with some tolerance)
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (deadlineDate < oneDayAgo) {
            throw new errors_1.ValidationError('Deadline cannot be more than 24 hours in the past');
        }
    }
    /**
     * Verify that a list exists and the user owns it
     * @private
     */
    async verifyListOwnership(listId, userId) {
        const list = await this.listsRepository.findById(listId, userId);
        if (!list) {
            throw new errors_1.NotFoundError('List not found or you do not have permission to access it');
        }
    }
    /**
     * Enforce business rules for task creation
     * @private
     */
    async enforceTaskCreationRules(taskData) {
        // Check if user has reached task limit per list (example business rule)
        const listTasks = await this.tasksRepository.findByListId(taskData.listId, taskData.userId);
        const MAX_TASKS_PER_LIST = 100; // Business rule: max 100 tasks per list
        if (listTasks.length >= MAX_TASKS_PER_LIST) {
            throw new errors_1.CustomError(`Cannot create more than ${MAX_TASKS_PER_LIST} tasks per list`, 400);
        }
    }
    /**
     * Enforce business rules for task updates
     * @private
     */
    async enforceTaskUpdateRules(existingTask, updates) {
        // Business rule: cannot change completion status of overdue high-priority tasks
        if (updates.isCompleted === false &&
            existingTask.priority === 'high' &&
            existingTask.deadline &&
            new Date(existingTask.deadline) < new Date()) {
            throw new errors_1.CustomError('Cannot mark overdue high-priority tasks as incomplete', 400);
        }
    }
    /**
     * Validate task deletion based on business rules
     * @private
     */
    async validateTaskDeletion(task) {
        // Business rule: prevent deletion of recently completed important tasks
        if (task.isCompleted &&
            task.priority === 'high' &&
            task.completedAt) {
            const completedDate = new Date(task.completedAt);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            if (completedDate > oneDayAgo) {
                throw new errors_1.CustomError('Cannot delete recently completed high-priority tasks', 400);
            }
        }
    }
    /**
     * Enrich task data with additional computed properties
     * @private
     */
    enrichTaskData(task) {
        const enriched = { ...task };
        // Add computed properties if deadline exists
        if (task.deadline) {
            const deadlineDate = new Date(task.deadline);
            const now = new Date();
            const diffMs = deadlineDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            // Add these as additional properties (extending the interface)
            enriched.daysUntilDue = diffDays;
            enriched.isOverdue = diffDays < 0 && !task.isCompleted;
            enriched.isDueSoon = diffDays >= 0 && diffDays <= 3 && !task.isCompleted;
        }
        return enriched;
    }
    /**
     * Log task deletion for audit purposes
     * @private
     */
    logTaskDeletion(task, userId) {
        // In a real application, this would log to an audit system
        console.log(`Task deleted - ID: ${task.id}, Title: ${task.title}, User: ${userId}, Completed: ${task.isCompleted}`);
    }
}
exports.TasksService = TasksService;
