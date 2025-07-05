"use strict";
/**
 * SQL Lists Repository Implementation
 * @fileoverview PostgreSQL-based implementation of lists repository for production
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListsSqlRepository = void 0;
const uuid_1 = require("uuid");
const errors_1 = require("../../utils/errors");
/**
 * PostgreSQL implementation of lists repository
 * Uses prepared statements and proper error handling
 */
class ListsSqlRepository {
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * Create a new list in the database
     * @param listData - The list creation data
     * @returns Promise resolving to the created list with task counts
     */
    async create(listData) {
        const client = await this.pool.connect();
        try {
            // Validate required fields
            if (!listData.name || !listData.userId) {
                throw new errors_1.ValidationError('Name and userId are required');
            }
            // Validate name length
            if (listData.name.length > 100) {
                throw new errors_1.ValidationError('List name cannot exceed 100 characters');
            }
            // Validate description length if provided
            if (listData.description && listData.description.length > 500) {
                throw new errors_1.ValidationError('List description cannot exceed 500 characters');
            }
            const listId = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            const query = `
        INSERT INTO lists (id, user_id, name, description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
            const values = [
                listId,
                listData.userId,
                listData.name.trim(),
                listData.description?.trim() || null,
                now,
                now
            ];
            const result = await client.query(query, values);
            const createdList = this.mapRowToList(result.rows[0]);
            // Task counts will be 0 for new list
            return {
                ...createdList,
                taskCount: 0,
                completedTaskCount: 0
            };
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            // Handle specific PostgreSQL errors
            if (error.code === '23503') { // Foreign key violation
                throw new errors_1.ValidationError('Invalid user ID');
            }
            throw new errors_1.CustomError('Failed to create list', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Find all lists belonging to a specific user with task counts
     * @param userId - The ID of the user
     * @returns Promise resolving to array of user's lists with task counts
     */
    async findByUserId(userId) {
        const client = await this.pool.connect();
        try {
            if (!userId) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const query = `
        SELECT 
          l.*,
          COALESCE(task_counts.task_count, 0) as task_count,
          COALESCE(task_counts.completed_task_count, 0) as completed_task_count
        FROM lists l
        LEFT JOIN (
          SELECT 
            list_id,
            COUNT(*) as task_count,
            COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_task_count
          FROM tasks
          WHERE user_id = $1
          GROUP BY list_id
        ) task_counts ON l.id = task_counts.list_id
        WHERE l.user_id = $1
        ORDER BY l.created_at DESC
      `;
            const result = await client.query(query, [userId]);
            return result.rows.map(row => this.mapRowToListWithCounts(row));
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve user lists', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Find a specific list by ID with optional user ownership validation
     * @param id - The list ID
     * @param userId - Optional user ID for ownership validation
     * @returns Promise resolving to the list or null if not found
     */
    async findById(id, userId) {
        const client = await this.pool.connect();
        try {
            if (!id) {
                throw new errors_1.ValidationError('List ID is required');
            }
            let query = `
        SELECT 
          l.*,
          COALESCE(task_counts.task_count, 0) as task_count,
          COALESCE(task_counts.completed_task_count, 0) as completed_task_count
        FROM lists l
        LEFT JOIN (
          SELECT 
            list_id,
            COUNT(*) as task_count,
            COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_task_count
          FROM tasks
          WHERE list_id = $1
          GROUP BY list_id
        ) task_counts ON l.id = task_counts.list_id
        WHERE l.id = $1
      `;
            const values = [id];
            // Add user ownership filter if userId provided
            if (userId) {
                query += ' AND l.user_id = $2';
                values.push(userId);
            }
            const result = await client.query(query, values);
            if (result.rows.length === 0) {
                return null;
            }
            const list = this.mapRowToListWithCounts(result.rows[0]);
            // If userId was provided but list belongs to different user, throw unauthorized
            if (userId && list.userId !== userId) {
                throw new errors_1.CustomError('User does not own this list', 403);
            }
            return list;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve list', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Update an existing list with user ownership validation
     * @param id - The list ID to update
     * @param updates - The updates to apply
     * @param userId - The ID of the user making the update
     * @returns Promise resolving to the updated list
     */
    async update(id, updates, userId) {
        const client = await this.pool.connect();
        try {
            if (!id || !userId) {
                throw new errors_1.ValidationError('List ID and user ID are required');
            }
            // Validate updates
            if (updates.name !== undefined) {
                if (!updates.name.trim()) {
                    throw new errors_1.ValidationError('List name cannot be empty');
                }
                if (updates.name.length > 100) {
                    throw new errors_1.ValidationError('List name cannot exceed 100 characters');
                }
            }
            if (updates.description !== undefined && updates.description && updates.description.length > 500) {
                throw new errors_1.ValidationError('List description cannot exceed 500 characters');
            }
            // First check if list exists and user owns it
            const existingList = await this.findById(id, userId);
            if (!existingList) {
                throw new errors_1.NotFoundError('List not found');
            }
            // Build dynamic update query
            const updateFields = [];
            const values = [];
            let paramIndex = 1;
            if (updates.name !== undefined) {
                updateFields.push(`name = $${paramIndex}`);
                values.push(updates.name.trim());
                paramIndex++;
            }
            if (updates.description !== undefined) {
                updateFields.push(`description = $${paramIndex}`);
                values.push(updates.description?.trim() || null);
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
        UPDATE lists 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex - 1} AND user_id = $${paramIndex}
        RETURNING *
      `;
            const result = await client.query(query, values);
            if (result.rows.length === 0) {
                throw new errors_1.NotFoundError('List not found or user does not own this list');
            }
            const updatedList = this.mapRowToList(result.rows[0]);
            // Get task counts
            const listWithCounts = await this.findById(id);
            return listWithCounts;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to update list', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Delete a list with user ownership validation
     * @param id - The list ID to delete
     * @param userId - The ID of the user making the deletion
     * @returns Promise resolving when deletion is complete
     */
    async delete(id, userId) {
        const client = await this.pool.connect();
        try {
            if (!id || !userId) {
                throw new errors_1.ValidationError('List ID and user ID are required');
            }
            await client.query('BEGIN');
            // First check if list exists and user owns it
            const checkQuery = `
        SELECT id FROM lists 
        WHERE id = $1 AND user_id = $2
      `;
            const checkResult = await client.query(checkQuery, [id, userId]);
            if (checkResult.rows.length === 0) {
                throw new errors_1.NotFoundError('List not found or user does not own this list');
            }
            // Delete associated tasks first (cascade delete)
            const deleteTasksQuery = `
        DELETE FROM tasks 
        WHERE list_id = $1 AND user_id = $2
      `;
            await client.query(deleteTasksQuery, [id, userId]);
            // Delete the list
            const deleteListQuery = `
        DELETE FROM lists 
        WHERE id = $1 AND user_id = $2
      `;
            await client.query(deleteListQuery, [id, userId]);
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to delete list', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Count total lists for a user
     * @param userId - The ID of the user
     * @returns Promise resolving to the count of user's lists
     */
    async countByUserId(userId) {
        const client = await this.pool.connect();
        try {
            if (!userId) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const query = `
        SELECT COUNT(*) as count 
        FROM lists 
        WHERE user_id = $1
      `;
            const result = await client.query(query, [userId]);
            return parseInt(result.rows[0].count, 10);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to count user lists', 500);
        }
        finally {
            client.release();
        }
    }
    /**
     * Map database row to List object (without task counts)
     * @param row - Database row
     * @returns List object without task counts
     */
    mapRowToList(row) {
        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
    /**
     * Map database row to List object with task counts
     * @param row - Database row with task counts
     * @returns Complete List object
     */
    mapRowToListWithCounts(row) {
        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            taskCount: parseInt(row.task_count, 10) || 0,
            completedTaskCount: parseInt(row.completed_task_count, 10) || 0
        };
    }
}
exports.ListsSqlRepository = ListsSqlRepository;
