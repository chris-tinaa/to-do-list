"use strict";
/**
 * Lists Service
 * @fileoverview Business logic layer for lists management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListsService = void 0;
const errors_1 = require("../utils/errors");
/**
 * Service class for handling lists business logic
 * Provides validation, business rules, and orchestration between API and repository layers
 */
class ListsService {
    constructor(listsRepository) {
        this.listsRepository = listsRepository;
    }
    /**
     * Create a new list with validation and business rules
     * @param listData - The list creation data
     * @returns Promise resolving to the created list
     * @throws {ValidationError} When input data is invalid
     * @throws {CustomError} When creation fails
     */
    async createList(listData) {
        try {
            // Business validation
            this.validateCreateListInput(listData);
            // Additional business rules
            await this.enforceBusinessRules(listData);
            // Create the list
            const createdList = await this.listsRepository.create(listData);
            return createdList;
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to create list', 500);
        }
    }
    /**
     * Get all lists for a user with task summaries
     * @param userId - The ID of the user
     * @returns Promise resolving to array of user's lists
     * @throws {ValidationError} When userId is invalid
     * @throws {CustomError} When retrieval fails
     */
    async getUserLists(userId) {
        try {
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const lists = await this.listsRepository.findByUserId(userId);
            // Apply business logic transformations
            return lists.map(list => this.enrichListData(list));
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve user lists', 500);
        }
    }
    /**
     * Get a specific list by ID with user ownership verification
     * @param listId - The ID of the list
     * @param userId - The ID of the user
     * @returns Promise resolving to the list or null if not found
     * @throws {ValidationError} When parameters are invalid
     * @throws {CustomError} When user doesn't own the list
     * @throws {CustomError} When retrieval fails
     */
    async getListById(listId, userId) {
        try {
            if (!listId || !listId.trim()) {
                throw new errors_1.ValidationError('List ID is required');
            }
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const list = await this.listsRepository.findById(listId, userId);
            if (!list) {
                return null;
            }
            return this.enrichListData(list);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve list', 500);
        }
    }
    /**
     * Update an existing list with validation and business rules
     * @param listId - The ID of the list to update
     * @param updates - The updates to apply
     * @param userId - The ID of the user making the update
     * @returns Promise resolving to the updated list
     * @throws {ValidationError} When input data is invalid
     * @throws {NotFoundError} When list doesn't exist
     * @throws {CustomError} When user doesn't own the list
     * @throws {CustomError} When update fails
     */
    async updateList(listId, updates, userId) {
        try {
            // Validate input parameters
            if (!listId || !listId.trim()) {
                throw new errors_1.ValidationError('List ID is required');
            }
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            // Business validation
            this.validateUpdateListInput(updates);
            // Check if list exists and user owns it
            const existingList = await this.listsRepository.findById(listId, userId);
            if (!existingList) {
                throw new errors_1.NotFoundError('List not found or you do not have permission to update it');
            }
            // Additional business rules for updates
            await this.enforceUpdateBusinessRules(existingList, updates);
            // Perform the update
            const updatedList = await this.listsRepository.update(listId, updates, userId);
            return this.enrichListData(updatedList);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to update list', 500);
        }
    }
    /**
     * Delete a list with user ownership verification and cascade options
     * @param listId - The ID of the list to delete
     * @param userId - The ID of the user making the deletion
     * @param options - Delete options including cascade behavior
     * @returns Promise resolving when deletion is complete
     * @throws {ValidationError} When parameters are invalid
     * @throws {NotFoundError} When list doesn't exist
     * @throws {CustomError} When user doesn't own the list
     * @throws {CustomError} When deletion fails
     */
    async deleteList(listId, userId, options) {
        try {
            // Validate input parameters
            if (!listId || !listId.trim()) {
                throw new errors_1.ValidationError('List ID is required');
            }
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            // Check if list exists and user owns it
            const existingList = await this.listsRepository.findById(listId, userId);
            if (!existingList) {
                throw new errors_1.NotFoundError('List not found or you do not have permission to delete it');
            }
            // Business rule validation for deletion
            await this.validateListDeletion(existingList, options);
            // Perform the deletion
            await this.listsRepository.delete(listId, userId);
            // Log the deletion for audit purposes
            this.logListDeletion(existingList, userId);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError || error instanceof errors_1.NotFoundError || error instanceof errors_1.CustomError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to delete list', 500);
        }
    }
    /**
     * Get list statistics for a user
     * @param userId - The ID of the user
     * @returns Promise resolving to list statistics
     * @throws {ValidationError} When userId is invalid
     * @throws {CustomError} When retrieval fails
     */
    async getListStatistics(userId) {
        try {
            if (!userId || !userId.trim()) {
                throw new errors_1.ValidationError('User ID is required');
            }
            const totalLists = await this.listsRepository.countByUserId(userId);
            const lists = await this.listsRepository.findByUserId(userId);
            const totalTasks = lists.reduce((sum, list) => sum + list.taskCount, 0);
            const completedTasks = lists.reduce((sum, list) => sum + list.completedTaskCount, 0);
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            return {
                totalLists,
                totalTasks,
                completedTasks,
                pendingTasks: totalTasks - completedTasks,
                completionRate: Math.round(completionRate * 100) / 100,
                listsWithTasks: lists.filter(list => list.taskCount > 0).length,
                emptyLists: lists.filter(list => list.taskCount === 0).length
            };
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
            throw new errors_1.CustomError('Failed to retrieve list statistics', 500);
        }
    }
    /**
     * Validate create list input
     * @private
     */
    validateCreateListInput(listData) {
        if (!listData.name || !listData.name.trim()) {
            throw new errors_1.ValidationError('List name is required');
        }
        if (!listData.userId || !listData.userId.trim()) {
            throw new errors_1.ValidationError('User ID is required');
        }
        if (listData.name.trim().length > 100) {
            throw new errors_1.ValidationError('List name cannot exceed 100 characters');
        }
        if (listData.description && listData.description.length > 500) {
            throw new errors_1.ValidationError('List description cannot exceed 500 characters');
        }
        // Check for potentially inappropriate content
        if (this.containsInappropriateContent(listData.name)) {
            throw new errors_1.ValidationError('List name contains inappropriate content');
        }
    }
    /**
     * Validate update list input
     * @private
     */
    validateUpdateListInput(updates) {
        if (updates.name !== undefined) {
            if (!updates.name || !updates.name.trim()) {
                throw new errors_1.ValidationError('List name cannot be empty');
            }
            if (updates.name.trim().length > 100) {
                throw new errors_1.ValidationError('List name cannot exceed 100 characters');
            }
            if (this.containsInappropriateContent(updates.name)) {
                throw new errors_1.ValidationError('List name contains inappropriate content');
            }
        }
        if (updates.description !== undefined && updates.description && updates.description.length > 500) {
            throw new errors_1.ValidationError('List description cannot exceed 500 characters');
        }
        // Ensure at least one field is being updated
        if (updates.name === undefined && updates.description === undefined) {
            throw new errors_1.ValidationError('At least one field must be provided for update');
        }
    }
    /**
     * Enforce business rules for list creation
     * @private
     */
    async enforceBusinessRules(listData) {
        // Check if user has reached list limit (example business rule)
        const userListCount = await this.listsRepository.countByUserId(listData.userId);
        const MAX_LISTS_PER_USER = 50; // Business rule: max 50 lists per user
        if (userListCount >= MAX_LISTS_PER_USER) {
            throw new errors_1.CustomError(`Cannot create more than ${MAX_LISTS_PER_USER} lists`, 400);
        }
        // Check for duplicate list names for the same user
        const existingLists = await this.listsRepository.findByUserId(listData.userId);
        const duplicateName = existingLists.some(list => list.name.toLowerCase() === listData.name.trim().toLowerCase());
        if (duplicateName) {
            throw new errors_1.ValidationError('A list with this name already exists');
        }
    }
    /**
     * Enforce business rules for list updates
     * @private
     */
    async enforceUpdateBusinessRules(existingList, updates) {
        // Check for duplicate names when updating
        if (updates.name && updates.name.trim().toLowerCase() !== existingList.name.toLowerCase()) {
            const userLists = await this.listsRepository.findByUserId(existingList.userId);
            const duplicateName = userLists.some(list => list.id !== existingList.id &&
                list.name.toLowerCase() === updates.name.trim().toLowerCase());
            if (duplicateName) {
                throw new errors_1.ValidationError('A list with this name already exists');
            }
        }
    }
    /**
     * Validate list deletion based on business rules
     * @private
     */
    async validateListDeletion(list, options) {
        // Prevent deletion of lists with tasks unless explicitly allowed
        if (list.taskCount > 0 && !options?.force) {
            throw new errors_1.CustomError('Cannot delete list with tasks. Use force option or delete tasks first.', 400);
        }
        // Additional business rules can be added here
        // For example: prevent deletion of certain system lists, etc.
    }
    /**
     * Enrich list data with additional computed properties
     * @private
     */
    enrichListData(list) {
        // Add any computed properties or business logic transformations
        return {
            ...list,
            // Example: Add completion percentage
            completionPercentage: list.taskCount > 0
                ? Math.round((list.completedTaskCount / list.taskCount) * 100)
                : 0
        };
    }
    /**
     * Check if content contains inappropriate terms
     * @private
     */
    containsInappropriateContent(content) {
        // Basic implementation - in real app, this would be more sophisticated
        const inappropriateTerms = ['spam', 'inappropriate', 'banned'];
        const lowerContent = content.toLowerCase();
        return inappropriateTerms.some(term => lowerContent.includes(term));
    }
    /**
     * Log list deletion for audit purposes
     * @private
     */
    logListDeletion(list, userId) {
        // In a real application, this would log to an audit system
        console.log(`List deleted - ID: ${list.id}, Name: ${list.name}, User: ${userId}, Tasks: ${list.taskCount}`);
    }
}
exports.ListsService = ListsService;
