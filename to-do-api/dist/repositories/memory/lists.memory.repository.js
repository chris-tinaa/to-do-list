"use strict";
/**
 * In-Memory Lists Repository Implementation
 * @fileoverview Memory-based implementation of lists repository for development and testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListsMemoryRepository = void 0;
const uuid_1 = require("uuid");
const errors_1 = require("../../utils/errors");
/**
 * In-memory implementation of lists repository
 * Uses Map for storage and simulates database operations
 */
class ListsMemoryRepository {
    constructor(tasksStore) {
        this.lists = new Map();
        this.tasks = new Map(); // Reference to tasks for count aggregation
        // Allow injection of tasks store for proper task count calculation
        if (tasksStore) {
            this.tasks = tasksStore;
        }
    }
    /**
     * Create a new list in memory storage
     * @param listData - The list creation data
     * @returns Promise resolving to the created list with task counts
     */
    async create(listData) {
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
            const now = new Date().toISOString();
            const listId = (0, uuid_1.v4)();
            const newList = {
                id: listId,
                userId: listData.userId,
                name: listData.name.trim(),
                description: listData.description?.trim() || undefined,
                createdAt: now,
                updatedAt: now
            };
            this.lists.set(listId, newList);
            // Return with task counts (will be 0 for new list)
            return this.addTaskCounts(newList);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to create list', 500);
        }
    }
    /**
     * Find all lists belonging to a specific user
     * @param userId - The ID of the user
     * @returns Promise resolving to array of user's lists with task counts
     */
    async findByUserId(userId) {
        try {
            if (!userId) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const userLists = [];
            for (const list of this.lists.values()) {
                if (list.userId === userId) {
                    userLists.push(this.addTaskCounts(list));
                }
            }
            // Sort by creation date (newest first)
            return userLists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve user lists', 500);
        }
    }
    /**
     * Find a specific list by ID with optional user ownership validation
     * @param id - The list ID
     * @param userId - Optional user ID for ownership validation
     * @returns Promise resolving to the list or null if not found
     */
    async findById(id, userId) {
        try {
            if (!id) {
                throw new errors_1.ValidationError('List ID is required');
            }
            const list = this.lists.get(id);
            if (!list) {
                return null;
            }
            // Validate user ownership if userId provided
            if (userId && list.userId !== userId) {
                throw new errors_1.CustomError('User does not own this list', 403);
            }
            return this.addTaskCounts(list);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve list', 500);
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
        try {
            if (!id || !userId) {
                throw new errors_1.ValidationError('List ID and user ID are required');
            }
            const existingList = this.lists.get(id);
            if (!existingList) {
                throw new errors_1.NotFoundError('List not found');
            }
            // Validate user ownership
            if (existingList.userId !== userId) {
                throw new errors_1.CustomError('User does not own this list', 403);
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
            // Apply updates
            const updatedList = {
                ...existingList,
                name: updates.name !== undefined ? updates.name.trim() : existingList.name,
                description: updates.description !== undefined ? updates.description?.trim() : existingList.description,
                updatedAt: new Date().toISOString()
            };
            this.lists.set(id, updatedList);
            return this.addTaskCounts(updatedList);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to update list', 500);
        }
    }
    /**
     * Delete a list with user ownership validation
     * @param id - The list ID to delete
     * @param userId - The ID of the user making the deletion
     * @returns Promise resolving when deletion is complete
     */
    async delete(id, userId) {
        try {
            if (!id || !userId) {
                throw new errors_1.ValidationError('List ID and user ID are required');
            }
            const existingList = this.lists.get(id);
            if (!existingList) {
                throw new errors_1.NotFoundError('List not found');
            }
            // Validate user ownership
            if (existingList.userId !== userId) {
                throw new errors_1.CustomError('User does not own this list', 403);
            }
            // Delete the list
            this.lists.delete(id);
            // Note: In a real implementation, we might want to cascade delete tasks
            // or move them to a "deleted items" list. For now, we'll leave tasks as-is
            // since they have listId foreign key that will become orphaned.
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to delete list', 500);
        }
    }
    /**
     * Count total lists for a user
     * @param userId - The ID of the user
     * @returns Promise resolving to the count of user's lists
     */
    async countByUserId(userId) {
        try {
            if (!userId) {
                throw new errors_1.ValidationError('User ID is required');
            }
            let count = 0;
            for (const list of this.lists.values()) {
                if (list.userId === userId) {
                    count++;
                }
            }
            return count;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to count user lists', 500);
        }
    }
    /**
     * Add task counts to a list basic object
     * @param listBasic - The basic list object
     * @returns List object with task counts
     */
    addTaskCounts(listBasic) {
        let taskCount = 0;
        let completedTaskCount = 0;
        // Count tasks for this list
        for (const task of this.tasks.values()) {
            if (task.listId === listBasic.id) {
                taskCount++;
                if (task.isCompleted) {
                    completedTaskCount++;
                }
            }
        }
        return {
            ...listBasic,
            taskCount,
            completedTaskCount
        };
    }
    /**
     * Clear all data (for testing)
     */
    async clear() {
        this.lists.clear();
    }
    /**
     * Get all lists (for testing/debugging)
     */
    async getAll() {
        return Array.from(this.lists.values());
    }
    /**
     * Set tasks store reference (for testing)
     */
    setTasksStore(tasksStore) {
        this.tasks = tasksStore;
    }
}
exports.ListsMemoryRepository = ListsMemoryRepository;
