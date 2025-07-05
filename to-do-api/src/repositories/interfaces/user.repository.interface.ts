/**
 * User Repository Interface
 * @fileoverview Interface for user data access operations
 * Current Date and Time (UTC): 2025-07-05 15:16:17
 * Current User: chris-tinaa
 */

import { User } from '../../models/user.model';

export interface UserRepository {
  /**
   * Creates a new user
   * @param user User data excluding auto-generated fields
   * @returns Promise that resolves with the created user
   */
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLoginAt'>): Promise<User>;

  /**
   * Finds a user by email address
   * @param email Email to search for
   * @returns Promise that resolves with the user or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Finds a user by ID
   * @param id User ID to search for
   * @returns Promise that resolves with the user or null if not found
   */
  findById(id: string): Promise<User | null>;

  /**
   * Updates an existing user
   * @param id User ID to update
   * @param updates Partial user data to update
   * @returns Promise that resolves with the updated user
   */
  update(
    id: string, 
    updates: Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>>
  ): Promise<User>;

  /**
   * Updates the last login timestamp for a user
   * @param id User ID to update
   * @returns Promise that resolves with the updated user
   */
  updateLastLogin(id: string): Promise<User>;

  /**
   * Deletes a user
   * @param id User ID to delete
   * @returns Promise that resolves when deletion is complete
   */
  delete(id: string): Promise<void>;

  /**
   * Get all users (for admin/debugging purposes)
   * @returns Promise that resolves with all users
   */
  findAll?(): Promise<User[]>;

  /**
   * Get user statistics
   * @returns Promise that resolves with user statistics
   */
  getStatistics?(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  }>;
}