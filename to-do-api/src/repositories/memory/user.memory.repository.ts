/**
 * User Memory Repository Implementation
 * @fileoverview In-memory implementation of UserRepository interface
 * Current Date and Time (UTC): 2025-07-05 15:16:17
 * Current User: chris-tinaa
 */

import { User } from '../../models/user.model';
import { UserRepository } from '../interfaces/user.repository.interface';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { v4 as uuidv4 } from 'uuid';

export class UserMemoryRepository implements UserRepository {
  private users: User[] = [];

  constructor() {
    // Initialize with default user for testing
    this.initializeDefaultUser();
  }

  /**
   * Initialize default user for testing purposes
   */
  private initializeDefaultUser(): void {
    const defaultUser: User = {
      id: 'user_chris_tinaa_001',
      email: 'chris-tinaa@example.com',
      password: '$2a$12$hashed_password_placeholder', // This should be properly hashed
      firstName: 'Chris',
      lastName: 'Tinaa',
      createdAt: new Date('2025-07-05T15:16:17.000Z'),
      updatedAt: new Date('2025-07-05T15:16:17.000Z'),
      isActive: true,
      lastLoginAt: null,
    };

    this.users.push(defaultUser);
  }

  /**
   * Creates a new user in memory.
   * @param user The user object to create, excluding ID, creation/update timestamps, and active status.
   * @returns A Promise that resolves with the created user, including its generated ID and timestamps.
   * @throws {ConflictError} If a user with the same email already exists.
   */
  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLoginAt'>): Promise<User> {
    // Validate required fields
    if (!user.email || !user.password || !user.firstName || !user.lastName) {
      throw new Error('Missing required user fields: email, password, firstName, and lastName are required');
    }

    // Check for duplicate email
    const existingUser = this.users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (existingUser) {
      throw new ConflictError(`User with email ${user.email} already exists.`);
    }

    // Create new user with current timestamp
    const currentTime = new Date('2025-07-05T15:16:17.000Z');
    const newUser: User = {
      id: uuidv4(),
      email: user.email.toLowerCase().trim(),
      password: user.password,
      firstName: user.firstName.trim(),
      lastName: user.lastName.trim(),
      createdAt: currentTime,
      updatedAt: currentTime,
      isActive: true, // Default to true upon creation
      lastLoginAt: null,
    };

    this.users.push(newUser);
    return newUser;
  }

  /**
   * Finds a user by their email address in memory.
   * @param email The email of the user to find.
   * @returns A Promise that resolves with the user if found, or null otherwise.
   */
  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }

    const user = this.users.find(user => 
      user.email.toLowerCase() === email.toLowerCase().trim()
    );
    
    return user || null;
  }

  /**
   * Finds a user by their ID in memory.
   * @param id The ID of the user to find.
   * @returns A Promise that resolves with the user if found, or null otherwise.
   */
  async findById(id: string): Promise<User | null> {
    if (!id) {
      return null;
    }

    const user = this.users.find(user => user.id === id);
    return user || null;
  }

  /**
   * Updates an existing user in memory.
   * @param id The ID of the user to update.
   * @param updates A partial user object containing the fields to update.
   * @returns A Promise that resolves with the updated user.
   * @throws {NotFoundError} If the user with the given ID is not found.
   */
  async update(
    id: string, 
    updates: Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>>
  ): Promise<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new NotFoundError(`User with ID ${id} not found.`);
    }

    const existingUser = this.users[index];
    
    // Create updated user object
    const updatedUser: User = {
      ...existingUser,
      ...updates,
      // Preserve immutable fields
      id: existingUser.id,
      email: existingUser.email,
      createdAt: existingUser.createdAt,
      // Update timestamp
      updatedAt: new Date('2025-07-05T15:16:17.000Z'),
    };

    // Trim string fields if they're being updated
    if (updates.firstName !== undefined) {
      updatedUser.firstName = updates.firstName.trim();
    }
    if (updates.lastName !== undefined) {
      updatedUser.lastName = updates.lastName.trim();
    }

    this.users[index] = updatedUser;
    return updatedUser;
  }

  /**
   * Updates the last login timestamp for a user
   * @param id The ID of the user to update
   * @returns A Promise that resolves with the updated user
   * @throws {NotFoundError} If the user with the given ID is not found.
   */
  async updateLastLogin(id: string): Promise<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new NotFoundError(`User with ID ${id} not found.`);
    }

    const existingUser = this.users[index];
    const currentTime = new Date('2025-07-05T15:16:17.000Z');
    
    const updatedUser: User = {
      ...existingUser,
      lastLoginAt: currentTime,
      updatedAt: currentTime,
    };

    this.users[index] = updatedUser;
    return updatedUser;
  }

  /**
   * Deletes a user from memory.
   * @param id The ID of the user to delete.
   * @returns A Promise that resolves when the user is deleted.
   * @throws {NotFoundError} If the user with the given ID is not found.
   */
  async delete(id: string): Promise<void> {
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== id);
    
    if (this.users.length === initialLength) {
      throw new NotFoundError(`User with ID ${id} not found.`);
    }
  }

  /**
   * Get all users (for admin/debugging purposes)
   * @returns A Promise that resolves with all users
   */
  async findAll(): Promise<User[]> {
    return [...this.users]; // Return a copy to prevent external modification
  }

  /**
   * Get user count statistics
   * @returns A Promise that resolves with user statistics
   */
  async getStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  }> {
    const totalUsers = this.users.length;
    const activeUsers = this.users.filter(user => user.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
    };
  }

  /**
   * Clear all users (for testing purposes)
   * @returns A Promise that resolves when all users are cleared
   */
  async clear(): Promise<void> {
    this.users = [];
  }
}