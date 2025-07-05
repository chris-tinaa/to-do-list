/**
 * Lists Repository Interface
 * @fileoverview Defines the contract for lists data access operations
 */

import { CreateListInput, List, UpdateListInput } from "../../models";


/**
 * Interface for lists repository operations
 * Provides data access methods for list management with user isolation
 */
export interface IListsRepository {
  /**
   * Create a new list for a user
   * @param listData - The list creation data
   * @returns Promise resolving to the created list
   * @throws {ValidationError} When input data is invalid
   * @throws {CustomError} When database operation fails
   */
  create(listData: CreateListInput): Promise<List>;

  /**
   * Find all lists belonging to a specific user
   * @param userId - The ID of the user
   * @returns Promise resolving to array of user's lists with task counts
   * @throws {CustomError} When database operation fails
   */
  findByUserId(userId: string): Promise<List[]>;

  /**
   * Find a specific list by ID with optional user ownership validation
   * @param id - The list ID
   * @param userId - Optional user ID for ownership validation
   * @returns Promise resolving to the list or null if not found
   * @throws {CustomError} When user doesn't own the list
   * @throws {CustomError} When database operation fails
   */
  findById(id: string, userId?: string): Promise<List | null>;

  /**
   * Update an existing list with user ownership validation
   * @param id - The list ID to update
   * @param updates - The updates to apply
   * @param userId - The ID of the user making the update
   * @returns Promise resolving to the updated list
   * @throws {NotFoundError} When list doesn't exist
   * @throws {CustomError} When user doesn't own the list
   * @throws {ValidationError} When update data is invalid
   * @throws {CustomError} When database operation fails
   */
  update(id: string, updates: UpdateListInput, userId: string): Promise<List>;

  /**
   * Delete a list with user ownership validation
   * @param id - The list ID to delete
   * @param userId - The ID of the user making the deletion
   * @returns Promise resolving when deletion is complete
   * @throws {NotFoundError} When list doesn't exist
   * @throws {CustomError} When user doesn't own the list
   * @throws {CustomError} When database operation fails
   */
  delete(id: string, userId: string): Promise<void>;

  /**
   * Count total lists for a user
   * @param userId - The ID of the user
   * @returns Promise resolving to the count of user's lists
   * @throws {CustomError} When database operation fails
   */
  countByUserId(userId: string): Promise<number>;
}