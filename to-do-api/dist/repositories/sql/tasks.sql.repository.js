"use strict";
/**
 * SQL Tasks Repository Implementation
 * @fileoverview PostgreSQL-based implementation of tasks repository for production
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksSqlRepository = void 0;
const uuid_1 = require("uuid");
const errors_1 = require("../../utils/errors");
/**
 * PostgreSQL implementation of tasks repository
 * Uses prepared statements and proper error handling
 */
class TasksSqlRepository {
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * Create a new task in the database
     * @param taskData - The task creation data
     * @returns Promise resolving to the created task
     */
    async create(taskData) {
        const client = await this.pool.connect();
        try {
            // Validate required fields
            if (!taskData.title || !taskData.listId || !taskData.userId) {
                throw new errors_1.ValidationError('Title, listId, and userId are required');
            }
            // Validate title length
            if (taskData.title.length > 200) {
                throw new errors_1.ValidationError('Task title cannot exceed 200 characters');
            }
            // Validate description length if provided
            if (taskData.description && taskData.description.length > 1000) {
                throw new errors_1.ValidationError('Task description cannot exceed 1000 characters');
            }
            // Validate deadline format if provided
            if (taskData.deadline) {
                const deadlineDate = new Date(taskData.deadline);
                if (isNaN(deadlineDate.getTime())) {
                    throw new errors_1.ValidationError('Invalid deadline format. Use ISO 8601 format');
                }
            }
            // Validate priority if provided
            if (taskData.priority && !['low', 'medium', 'high'].includes(taskData.priority)) {
                throw new errors_1.ValidationError('Priority must be low, medium, or high');
            }
            const taskId = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            const query = `
        INSERT INTO tasks (id, list_id, user_id, title, description, deadline, is_completed, priority, created_at, updated_at, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
            const values = [
                taskId,
                taskData.listId,
                taskData.userId,
                taskData.title.trim(),
                taskData.description?.trim() || null,
                taskData.deadline || null,
                false,
                taskData.priority || null,
                now,
                now,
                null
            ];
            const result = await client.query(query, values);
            return this.mapRowToTask(result.rows[0]);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            // Handle specific PostgreSQL errors
            if (error.code === '23503') { // Foreign key violation
                if (error.constraint?.includes('list_id')) {
                    throw new errors_1.ValidationError('Invalid list ID');
                }
                if (error.constraint?.includes('user_id')) {
                    throw new errors_1.ValidationError('Invalid user ID');
                }
            }
            throw new errors_1.CustomError('Failed to create task', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Find all tasks belonging to a specific list
     * @param listId - The ID of the list
     * @param userId - The ID of the user (for ownership validation)
     * @returns Promise resolving to array of tasks in the list
     */
    async findByListId(listId, userId) {
        const client = await this.pool.connect();
        try {
            if (!listId || !userId) {
                throw new errors_1.ValidationError('List ID and user ID are required');
            }
            const query = `
        SELECT * FROM tasks 
        WHERE list_id = $1 AND user_id = $2
        ORDER BY created_at DESC
      `;
            const result = await client.query(query, [listId, userId]);
            return result.rows.map(row => this.mapRowToTask(row));
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve list tasks', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Find a specific task by ID with user ownership validation
     * @param id - The task ID
     * @param userId - The ID of the user for ownership validation
     * @returns Promise resolving to the task or null if not found
     */
    async findById(id, userId) {
        const client = await this.pool.connect();
        try {
            if (!id || !userId) {
                throw new errors_1.ValidationError('Task ID and user ID are required');
            }
            const query = `
        SELECT * FROM tasks 
        WHERE id = $1 AND user_id = $2
      `;
            const result = await client.query(query, [id, userId]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToTask(result.rows[0]);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve task', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Update an existing task with user ownership validation
     * @param id - The task ID to update
     * @param updates - The updates to apply
     * @param userId - The ID of the user making the update
     * @returns Promise resolving to the updated task
     */
    async update(id, updates, userId) {
        const client = await this.pool.connect();
        try {
            if (!id || !userId) {
                throw new errors_1.ValidationError('Task ID and user ID are required');
            }
            // Validate updates
            if (updates.title !== undefined) {
                if (!updates.title.trim()) {
                    throw new errors_1.ValidationError('Task title cannot be empty');
                }
                if (updates.title.length > 200) {
                    throw new errors_1.ValidationError('Task title cannot exceed 200 characters');
                }
            }
            if (updates.description !== undefined && updates.description && updates.description.length > 1000) {
                throw new errors_1.ValidationError('Task description cannot exceed 1000 characters');
            }
            if (updates.deadline !== undefined && updates.deadline) {
                const deadlineDate = new Date(updates.deadline);
                if (isNaN(deadlineDate.getTime())) {
                    throw new errors_1.ValidationError('Invalid deadline format. Use ISO 8601 format');
                }
            }
            if (updates.priority !== undefined && updates.priority && !['low', 'medium', 'high'].includes(updates.priority)) {
                throw new errors_1.ValidationError('Priority must be low, medium, or high');
            }
            // First check if task exists and user owns it
            const existingTask = await this.findById(id, userId);
            if (!existingTask) {
                throw new errors_1.NotFoundError('Task not found');
            }
            // Build dynamic update query
            const updateFields = [];
            const values = [];
            let paramIndex = 1;
            if (updates.title !== undefined) {
                updateFields.push(`title = $${paramIndex}`);
                values.push(updates.title.trim());
                paramIndex++;
            }
            if (updates.description !== undefined) {
                updateFields.push(`description = $${paramIndex}`);
                values.push(updates.description?.trim() || null);
                paramIndex++;
            }
            if (updates.deadline !== undefined) {
                updateFields.push(`deadline = $${paramIndex}`);
                values.push(updates.deadline || null);
                paramIndex++;
            }
            if (updates.priority !== undefined) {
                updateFields.push(`priority = $${paramIndex}`);
                values.push(updates.priority || null);
                paramIndex++;
            }
            if (updates.isCompleted !== undefined) {
                updateFields.push(`is_completed = $${paramIndex}`);
                values.push(updates.isCompleted);
                paramIndex++;
                updateFields.push(`completed_at = $${paramIndex}`);
                values.push(updates.isCompleted ? new Date().toISOString() : null);
                paramIndex++;
            }
            if (updateFields.length === 0) {
                throw new errors_1.ValidationError('No valid updates provided');
            }
            // Add updated_at
            updateFields.push(`updated_at = $${paramIndex}`);
            values.push(new Date().toISOString());
            paramIndex++;
            // Add WHERE conditions
            values.push(id, userId);
            const query = `
        UPDATE tasks 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex - 1} AND user_id = $${paramIndex}
        RETURNING *
      `;
            const result = await client.query(query, values);
            if (result.rows.length === 0) {
                throw new errors_1.NotFoundError('Task not found or user does not own this task');
            }
            return this.mapRowToTask(result.rows[0]);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to update task', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Delete a task with user ownership validation
     * @param id - The task ID to delete
     * @param userId - The ID of the user making the deletion
     * @returns Promise resolving when deletion is complete
     */
    async delete(id, userId) {
        const client = await this.pool.connect();
        try {
            if (!id || !userId) {
                throw new errors_1.ValidationError('Task ID and user ID are required');
            }
            const query = `
        DELETE FROM tasks 
        WHERE id = $1 AND user_id = $2
      `;
            const result = await client.query(query, [id, userId]);
            if (result.rowCount === 0) {
                throw new errors_1.NotFoundError('Task not found or user does not own this task');
            }
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to delete task', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Mark a task as completed
     * @param id - The task ID to mark as completed
     * @param userId - The ID of the user making the change
     * @returns Promise resolving to the updated task
     */
    async markComplete(id, userId) {
        try {
            return await this.update(id, { isCompleted: true }, userId);
        }
        catch (error) {
            throw error; // Re-throw the error from update method
        }
    }
    /**
     * Mark a task as incomplete
     * @param id - The task ID to mark as incomplete
     * @param userId - The ID of the user making the change
     * @returns Promise resolving to the updated task
     */
    async markIncomplete(id, userId) {
        try {
            return await this.update(id, { isCompleted: false }, userId);
        }
        catch (error) {
            throw error; // Re-throw the error from update method
        }
    }
    /**
     * Find tasks due within the current week for a user
     * @param userId - The ID of the user
     * @returns Promise resolving to array of tasks due this week
     */
    async findDueThisWeek(userId) {
        const client = await this.pool.connect();
        try {
            if (!userId) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const query = `
        SELECT * FROM tasks 
        WHERE user_id = $1 
          AND deadline IS NOT NULL 
          AND is_completed = false
          AND deadline >= NOW()
          AND deadline <= NOW() + INTERVAL '7 days'
        ORDER BY deadline ASC
      `;
            const result = await client.query(query, [userId]);
            return result.rows.map(row => this.mapRowToTask(row));
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve tasks due this week', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Find all tasks for a user with optional filtering and sorting
     * @param userId - The ID of the user
     * @param options - Optional filtering and sorting options
     * @returns Promise resolving to array of filtered/sorted tasks
     */
    async findByUserId(userId, options) {
        const client = await this.pool.connect();
        try {
            if (!userId) {
                throw new errors_1.ValidationError('User ID is required');
            }
            let query = 'SELECT * FROM tasks WHERE user_id = $1';
            const values = [userId];
            let paramIndex = 2;
            // Apply filters
            if (options?.isCompleted !== undefined) {
                query += ` AND is_completed = $${paramIndex}`;
                values.push(options.isCompleted);
                paramIndex++;
            }
            if (options?.priority) {
                query += ` AND priority = $${paramIndex}`;
                values.push(options.priority);
                paramIndex++;
            }
            // Apply sorting
            if (options?.sortBy) {
                const sortColumn = this.getSortColumn(options.sortBy);
                const sortOrder = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
                query += ` ORDER BY ${sortColumn} ${sortOrder}`;
            }
            else {
                query += ' ORDER BY created_at DESC';
            }
            // Apply pagination
            if (options?.limit) {
                query += ` LIMIT $${paramIndex}`;
                values.push(options.limit);
                paramIndex++;
            }
            if (options?.offset) {
                query += ` OFFSET $${paramIndex}`;
                values.push(options.offset);
                paramIndex++;
            }
            const result = await client.query(query, values);
            return result.rows.map(row => this.mapRowToTask(row));
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve user tasks', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Count total tasks for a user
     * @param userId - The ID of the user
     * @returns Promise resolving to the count of user's tasks
     */
    async countByUserId(userId) {
        const client = await this.pool.connect();
        try {
            if (!userId) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const query = `
        SELECT COUNT(*) as count 
        FROM tasks 
        WHERE user_id = $1
      `;
            const result = await client.query(query, [userId]);
            return parseInt(result.rows[0].count, 10);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to count user tasks', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Count completed tasks for a user
     * @param userId - The ID of the user
     * @returns Promise resolving to the count of user's completed tasks
     */
    async countCompletedByUserId(userId) {
        const client = await this.pool.connect();
        try {
            if (!userId) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const query = `
        SELECT COUNT(*) as count 
        FROM tasks 
        WHERE user_id = $1 AND is_completed = true
      `;
            const result = await client.query(query, [userId]);
            return parseInt(result.rows[0].count, 10);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to count completed tasks', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Get SQL sort column for task sorting
     * @param sortBy - Sort field
     * @returns SQL column name
     */
    getSortColumn(sortBy) {
        switch (sortBy) {
            case 'createdAt':
                return 'created_at';
            case 'updatedAt':
                return 'updated_at';
            case 'deadline':
                return 'deadline NULLS LAST';
            case 'title':
                return 'title';
            case 'priority':
                return 'CASE priority WHEN \'high\' THEN 3 WHEN \'medium\' THEN 2 WHEN \'low\' THEN 1 ELSE 0 END';
            default:
                return 'created_at';
        }
    }
    /**
     * Map database row to Task object
     * @param row - Database row
     * @returns Task object
     */
    mapRowToTask(row) {
        return {
            id: row.id,
            listId: row.list_id,
            userId: row.user_id,
            title: row.title,
            description: row.description || undefined,
            deadline: row.deadline || undefined,
            isCompleted: row.is_completed,
            priority: row.priority || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            completedAt: row.completed_at || undefined
        };
    }
}
exports.TasksSqlRepository = TasksSqlRepository;
