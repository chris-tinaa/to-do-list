/**
 * Tasks Repository Interface
 * @fileoverview Defines the contract for tasks data access operations
 */

import { CreateTaskInput, Task, UpdateTaskInput } from "../../models";


/**
 * Interface for tasks repository operations
 * Provides data access methods for task management with user isolation and advanced querying
 */
export interface ITasksRepository {
  /**
   * Create a new task for a user
   * @param taskData - The task creation data
   * @returns Promise resolving to the created task
   * @throws {ValidationError} When input data is invalid
   * @throws {CustomError} When database operation fails
   */
  create(taskData: CreateTaskInput): Promise<Task>;

  /**
   * Find all tasks belonging to a specific list
   * @param listId - The ID of the list
   * @param userId - The ID of the user (for ownership validation)
   * @returns Promise resolving to array of tasks in the list
   * @throws {CustomError} When user doesn't own the list
   * @throws {CustomError} When database operation fails
   */
  findByListId(listId: string, userId: string): Promise<Task[]>;

  /**
   * Find a specific task by ID with user ownership validation
   * @param id - The task ID
   * @param userId - The ID of the user for ownership validation
   * @returns Promise resolving to the task or null if not found
   * @throws {CustomError} When user doesn't own the task
   * @throws {CustomError} When database operation fails
   */
  findById(id: string, userId: string): Promise<Task | null>;

  /**
   * Update an existing task with user ownership validation
   * @param id - The task ID to update
   * @param updates - The updates to apply
   * @param userId - The ID of the user making the update
   * @returns Promise resolving to the updated task
   * @throws {NotFoundError} When task doesn't exist
   * @throws {CustomError} When user doesn't own the task
   * @throws {ValidationError} When update data is invalid
   * @throws {CustomError} When database operation fails
   */
  update(id: string, updates: UpdateTaskInput, userId: string): Promise<Task>;

  /**
   * Delete a task with user ownership validation
   * @param id - The task ID to delete
   * @param userId - The ID of the user making the deletion
   * @returns Promise resolving when deletion is complete
   * @throws {NotFoundError} When task doesn't exist
   * @throws {CustomError} When user doesn't own the task
   * @throws {CustomError} When database operation fails
   */
  delete(id: string, userId: string): Promise<void>;

  /**
   * Mark a task as completed
   * @param id - The task ID to mark as completed
   * @param userId - The ID of the user making the change
   * @returns Promise resolving to the updated task
   * @throws {NotFoundError} When task doesn't exist
   * @throws {CustomError} When user doesn't own the task
   * @throws {CustomError} When database operation fails
   */
  markComplete(id: string, userId: string): Promise<Task>;

  /**
   * Mark a task as incomplete
   * @param id - The task ID to mark as incomplete
   * @param userId - The ID of the user making the change
   * @returns Promise resolving to the updated task
   * @throws {NotFoundError} When task doesn't exist
   * @throws {CustomError} When user doesn't own the task
   * @throws {CustomError} When database operation fails
   */
  markIncomplete(id: string, userId: string): Promise<Task>;

  /**
   * Find tasks due within the current week for a user
   * @param userId - The ID of the user
   * @returns Promise resolving to array of tasks due this week
   * @throws {CustomError} When database operation fails
   */
  findDueThisWeek(userId: string): Promise<Task[]>;

  /**
   * Find all tasks for a user with optional filtering and sorting
   * @param userId - The ID of the user
   * @param options - Optional filtering and sorting options
   * @returns Promise resolving to array of filtered/sorted tasks
   * @throws {CustomError} When database operation fails
   */
  findByUserId(userId: string, options?: TaskQueryOptions): Promise<Task[]>;

  /**
   * Count total tasks for a user
   * @param userId - The ID of the user
   * @returns Promise resolving to the count of user's tasks
   * @throws {CustomError} When database operation fails
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Count completed tasks for a user
   * @param userId - The ID of the user
   * @returns Promise resolving to the count of user's completed tasks
   * @throws {CustomError} When database operation fails
   */
  countCompletedByUserId(userId: string): Promise<number>;
}

/**
 * Task query options for filtering and sorting
 */
export interface TaskQueryOptions {
  /** Filter by completion status */
  isCompleted?: boolean;
  /** Filter by priority level */
  priority?: 'low' | 'medium' | 'high';
  /** Sort field */
  sortBy?: 'createdAt' | 'updatedAt' | 'deadline' | 'title' | 'priority';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}