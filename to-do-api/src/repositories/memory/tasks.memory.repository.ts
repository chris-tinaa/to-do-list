/**
 * In-Memory Tasks Repository Implementation
 * @fileoverview Memory-based implementation of tasks repository for development and testing
 */

import { v4 as uuidv4 } from 'uuid';
import { ITasksRepository, TaskQueryOptions } from '../interfaces/tasks.repository.interface';
import { Task, CreateTaskInput, UpdateTaskInput } from '../../models/task.model';
import { CustomError, NotFoundError, ValidationError } from '../../utils/errors';

/**
 * In-memory implementation of tasks repository
 * Uses Map for storage and simulates database operations
 */
export class TasksMemoryRepository implements ITasksRepository {
  private tasks: Map<string, Task> = new Map();

  constructor(tasksStore?: Map<string, Task>) {
    // Allow injection of shared tasks store for consistency with other repositories
    if (tasksStore) {
      this.tasks = tasksStore;
    }
  }

  /**
   * Create a new task in memory storage
   * @param taskData - The task creation data
   * @returns Promise resolving to the created task
   */
  async create(taskData: CreateTaskInput): Promise<Task> {
    try {
      // Validate required fields
      if (!taskData.title || !taskData.listId || !taskData.userId) {
        throw new ValidationError('Title, listId, and userId are required');
      }

      // Validate title length
      if (taskData.title.length > 200) {
        throw new ValidationError('Task title cannot exceed 200 characters');
      }

      // Validate description length if provided
      if (taskData.description && taskData.description.length > 1000) {
        throw new ValidationError('Task description cannot exceed 1000 characters');
      }

      // Validate deadline format if provided
      if (taskData.deadline) {
        const deadlineDate = new Date(taskData.deadline);
        if (isNaN(deadlineDate.getTime())) {
          throw new ValidationError('Invalid deadline format. Use ISO 8601 format');
        }
      }

      // Validate priority if provided
      if (taskData.priority && !['low', 'medium', 'high'].includes(taskData.priority)) {
        throw new ValidationError('Priority must be low, medium, or high');
      }

      const now = new Date().toISOString();
      const taskId = uuidv4();

      const newTask: Task = {
        id: taskId,
        listId: taskData.listId,
        userId: taskData.userId,
        title: taskData.title.trim(),
        description: taskData.description?.trim(),
        deadline: taskData.deadline,
        isCompleted: false,
        priority: taskData.priority,
        createdAt: now,
        updatedAt: now,
        completedAt: null
      };

      this.tasks.set(taskId, newTask);

      return newTask;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new CustomError('Failed to create task', 500);
    }
  }

  /**
   * Find all tasks belonging to a specific list
   * @param listId - The ID of the list
   * @param userId - The ID of the user (for ownership validation)
   * @returns Promise resolving to array of tasks in the list
   */
  async findByListId(listId: string, userId: string): Promise<Task[]> {
    try {
      if (!listId || !userId) {
        throw new ValidationError('List ID and user ID are required');
      }

      const listTasks: Task[] = [];

      for (const task of this.tasks.values()) {
        if (task.listId === listId && task.userId === userId) {
          listTasks.push(task);
        }
      }

      // Sort by creation date (newest first)
      return listTasks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve list tasks', 500);
    }
  }

  /**
   * Find a specific task by ID with user ownership validation
   * @param id - The task ID
   * @param userId - The ID of the user for ownership validation
   * @returns Promise resolving to the task or null if not found
   */
  async findById(id: string, userId: string): Promise<Task | null> {
    try {
      if (!id || !userId) {
        throw new ValidationError('Task ID and user ID are required');
      }

      const task = this.tasks.get(id);
      if (!task) {
        return null;
      }

      // Validate user ownership
      if (task.userId !== userId) {
        throw new CustomError('User does not own this task', 403);
      }

      return task;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve task', 500);
    }
  }

  /**
   * Update an existing task with user ownership validation
   * @param id - The task ID to update
   * @param updates - The updates to apply
   * @param userId - The ID of the user making the update
   * @returns Promise resolving to the updated task
   */
  async update(id: string, updates: UpdateTaskInput, userId: string): Promise<Task> {
    try {
      if (!id || !userId) {
        throw new ValidationError('Task ID and user ID are required');
      }

      const existingTask = this.tasks.get(id);
      if (!existingTask) {
        throw new NotFoundError('Task not found');
      }

      // Validate user ownership
      if (existingTask.userId !== userId) {
        throw new CustomError('User does not own this task', 403);
      }

      // Validate updates
      if (updates.title !== undefined) {
        if (!updates.title.trim()) {
          throw new ValidationError('Task title cannot be empty');
        }
        if (updates.title.length > 200) {
          throw new ValidationError('Task title cannot exceed 200 characters');
        }
      }

      if (updates.description !== undefined && updates.description && updates.description.length > 1000) {
        throw new ValidationError('Task description cannot exceed 1000 characters');
      }

      if (updates.deadline !== undefined && updates.deadline) {
        const deadlineDate = new Date(updates.deadline);
        if (isNaN(deadlineDate.getTime())) {
          throw new ValidationError('Invalid deadline format. Use ISO 8601 format');
        }
      }

      if (updates.priority !== undefined && updates.priority && !['low', 'medium', 'high'].includes(updates.priority)) {
        throw new ValidationError('Priority must be low, medium, or high');
      }

      const now = new Date().toISOString();

      // Apply updates
      const updatedTask: Task = {
        ...existingTask,
        title: updates.title !== undefined ? updates.title.trim() : existingTask.title,
        description: updates.description !== undefined ? updates.description?.trim() : existingTask.description,
        deadline: updates.deadline !== undefined ? updates.deadline : existingTask.deadline,
        priority: updates.priority !== undefined ? updates.priority : existingTask.priority,
        isCompleted: updates.isCompleted !== undefined ? updates.isCompleted : existingTask.isCompleted,
        updatedAt: now,
        completedAt: updates.isCompleted === true ? now : (updates.isCompleted === false ? null : existingTask.completedAt)
      };

      this.tasks.set(id, updatedTask);

      return updatedTask;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update task', 500);
    }
  }

  /**
   * Delete a task with user ownership validation
   * @param id - The task ID to delete
   * @param userId - The ID of the user making the deletion
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string, userId: string): Promise<void> {
    try {
      if (!id || !userId) {
        throw new ValidationError('Task ID and user ID are required');
      }

      const existingTask = this.tasks.get(id);
      if (!existingTask) {
        throw new NotFoundError('Task not found');
      }

      // Validate user ownership
      if (existingTask.userId !== userId) {
        throw new CustomError('User does not own this task', 403);
      }

      // Delete the task
      this.tasks.delete(id);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete task', 500);
    }
  }

  /**
   * Mark a task as completed
   * @param id - The task ID to mark as completed
   * @param userId - The ID of the user making the change
   * @returns Promise resolving to the updated task
   */
  async markComplete(id: string, userId: string): Promise<Task> {
    try {
      return await this.update(id, { isCompleted: true }, userId);
    } catch (error) {
      throw error; // Re-throw the error from update method
    }
  }

  /**
   * Mark a task as incomplete
   * @param id - The task ID to mark as incomplete
   * @param userId - The ID of the user making the change
   * @returns Promise resolving to the updated task
   */
  async markIncomplete(id: string, userId: string): Promise<Task> {
    try {
      return await this.update(id, { isCompleted: false }, userId);
    } catch (error) {
      throw error; // Re-throw the error from update method
    }
  }

  /**
   * Find tasks due within the current week for a user
   * @param userId - The ID of the user
   * @returns Promise resolving to array of tasks due this week
   */
  async findDueThisWeek(userId: string): Promise<Task[]> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const dueThisWeek: Task[] = [];

      for (const task of this.tasks.values()) {
        if (task.userId === userId && task.deadline && !task.isCompleted) {
          const deadlineDate = new Date(task.deadline);
          if (deadlineDate >= now && deadlineDate <= weekFromNow) {
            dueThisWeek.push(task);
          }
        }
      }

      // Sort by deadline (soonest first)
      return dueThisWeek.sort((a, b) => 
        new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve tasks due this week', 500);
    }
  }

  /**
   * Find all tasks for a user with optional filtering and sorting
   * @param userId - The ID of the user
   * @param options - Optional filtering and sorting options
   * @returns Promise resolving to array of filtered/sorted tasks
   */
  async findByUserId(userId: string, options?: TaskQueryOptions): Promise<Task[]> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      let userTasks: Task[] = [];

      // Filter by user
      for (const task of this.tasks.values()) {
        if (task.userId === userId) {
          userTasks.push(task);
        }
      }

      // Apply filters
      if (options) {
        if (options.isCompleted !== undefined) {
          userTasks = userTasks.filter(task => task.isCompleted === options.isCompleted);
        }

        if (options.priority) {
          userTasks = userTasks.filter(task => task.priority === options.priority);
        }
      }

      // Apply sorting
      if (options?.sortBy) {
        userTasks.sort((a, b) => {
          let aValue: any, bValue: any;

          switch (options.sortBy) {
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            case 'updatedAt':
              aValue = new Date(a.updatedAt).getTime();
              bValue = new Date(b.updatedAt).getTime();
              break;
            case 'deadline':
              aValue = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
              bValue = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
              break;
            case 'title':
              aValue = a.title.toLowerCase();
              bValue = b.title.toLowerCase();
              break;
            case 'priority':
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
              bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
              break;
            default:
              aValue = a.createdAt;
              bValue = b.createdAt;
          }

          if (options.sortOrder === 'desc') {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        });
      } else {
        // Default sort by creation date (newest first)
        userTasks.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      // Apply pagination
      if (options?.offset || options?.limit) {
        const offset = options.offset || 0;
        const limit = options.limit;
        userTasks = limit ? userTasks.slice(offset, offset + limit) : userTasks.slice(offset);
      }

      return userTasks;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve user tasks', 500);
    }
  }

  /**
   * Count total tasks for a user
   * @param userId - The ID of the user
   * @returns Promise resolving to the count of user's tasks
   */
  async countByUserId(userId: string): Promise<number> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      let count = 0;
      for (const task of this.tasks.values()) {
        if (task.userId === userId) {
          count++;
        }
      }

      return count;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new CustomError('Failed to count user tasks', 500);
    }
  }

  /**
   * Count completed tasks for a user
   * @param userId - The ID of the user
   * @returns Promise resolving to the count of user's completed tasks
   */
  async countCompletedByUserId(userId: string): Promise<number> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      let count = 0;
      for (const task of this.tasks.values()) {
        if (task.userId === userId && task.isCompleted) {
          count++;
        }
      }

      return count;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new CustomError('Failed to count completed tasks', 500);
    }
  }

  /**
   * Clear all data (for testing)
   */
  async clear(): Promise<void> {
    this.tasks.clear();
  }

  /**
   * Get all tasks (for testing/debugging)
   */
  async getAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  /**
   * Set tasks store reference (for testing)
   */
  setTasksStore(tasksStore: Map<string, Task>): void {
    this.tasks = tasksStore;
  }
}