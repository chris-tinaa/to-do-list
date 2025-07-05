/**
 * User SQL Repository Implementation
 * @fileoverview PostgreSQL implementation of UserRepository interface
 * Current Date and Time (UTC): 2025-07-05 15:16:17
 * Current User: chris-tinaa
 */

import { User } from '../../models/user.model';
import { UserRepository } from '../interfaces/user.repository.interface';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ConflictError } from '../../utils/errors';

export class UserSQLRepository implements UserRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Helper to convert DB row to User model with proper date handling
   * @param row Database row object
   * @returns User model object
   */
  private dbRowToUser(row: any): User {
    if (!row) {
      throw new Error('Cannot convert null or undefined row to User');
    }

    return {
      id: row.id,
      email: row.email,
      password: row.password,
      firstName: row.first_name,
      lastName: row.last_name,
      createdAt: this.parseDate(row.created_at),
      updatedAt: this.parseDate(row.updated_at),
      isActive: Boolean(row.is_active),
      lastLoginAt: row.last_login_at ? this.parseDate(row.last_login_at) : null,
    };
  }

  /**
   * Helper to parse date from database
   * @param dateValue Database date value
   * @returns Date object
   */
  private parseDate(dateValue: any): Date {
    if (dateValue instanceof Date) {
      return dateValue;
    }
    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }
    throw new Error(`Invalid date value: ${dateValue}`);
  }

  /**
   * Helper to get current timestamp
   * @returns Current timestamp as Date object
   */
  private getCurrentTimestamp(): Date {
    return new Date('2025-07-05T15:16:17.000Z');
  }

  /**
   * Creates a new user in the database.
   * @param user The user object to create, excluding ID, creation/update timestamps, and active status.
   * @returns A Promise that resolves with the created user, including its generated ID and timestamps.
   * @throws {ConflictError} If a user with the same email already exists.
   */
  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLoginAt'>): Promise<User> {
    // Validate required fields
    if (!user.email || !user.password || !user.firstName || !user.lastName) {
      throw new Error('Missing required user fields: email, password, firstName, and lastName are required');
    }

    const client = await this.pool.connect();
    try {
      const newId = uuidv4();
      const currentTime = this.getCurrentTimestamp();
      
      const query = `
        INSERT INTO users (
          id, 
          email, 
          password, 
          first_name, 
          last_name, 
          created_at, 
          updated_at, 
          is_active,
          last_login_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING 
          id, 
          email, 
          password,
          first_name, 
          last_name, 
          created_at, 
          updated_at, 
          is_active,
          last_login_at;
      `;
      
      const values = [
        newId, 
        user.email.toLowerCase().trim(), 
        user.password, 
        user.firstName.trim(), 
        user.lastName.trim(),
        currentTime,
        currentTime,
        true, // Default to active
        null  // No login yet
      ];
      
      const result = await client.query(query, values);
      return this.dbRowToUser(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        throw new ConflictError(`User with email ${user.email} already exists.`);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Finds a user by their email address in the database.
   * @param email The email of the user to find.
   * @returns A Promise that resolves with the user if found, or null otherwise.
   */
  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }

    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          id, 
          email, 
          password,
          first_name, 
          last_name, 
          created_at, 
          updated_at, 
          is_active,
          last_login_at 
        FROM users 
        WHERE LOWER(email) = LOWER($1);
      `;
      
      const result = await client.query(query, [email.trim()]);
      const foundUser = result.rows[0];
      
      return foundUser ? this.dbRowToUser(foundUser) : null;
    } finally {
      client.release();
    }
  }

  /**
   * Finds a user by their ID in the database.
   * @param id The ID of the user to find.
   * @returns A Promise that resolves with the user if found, or null otherwise.
   */
  async findById(id: string): Promise<User | null> {
    if (!id) {
      return null;
    }

    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          id, 
          email, 
          password,
          first_name, 
          last_name, 
          created_at, 
          updated_at, 
          is_active,
          last_login_at 
        FROM users 
        WHERE id = $1;
      `;
      
      const result = await client.query(query, [id]);
      const foundUser = result.rows[0];
      
      return foundUser ? this.dbRowToUser(foundUser) : null;
    } finally {
      client.release();
    }
  }

  /**
   * Updates an existing user in the database.
   * @param id The ID of the user to update.
   * @param updates A partial user object containing the fields to update.
   * @returns A Promise that resolves with the updated user.
   * @throws {NotFoundError} If the user with the given ID is not found.
   */
  async update(
    id: string,
    updates: Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>>
  ): Promise<User> {
    if (!id) {
      throw new NotFoundError('User ID is required');
    }

    const client = await this.pool.connect();
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Handle field updates with proper snake_case conversion
      const fieldMapping: Record<string, string> = {
        firstName: 'first_name',
        lastName: 'last_name',
        password: 'password',
        isActive: 'is_active',
      };

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && fieldMapping[key]) {
          const dbFieldName = fieldMapping[key];
          setClauses.push(`${dbFieldName} = $${paramIndex}`);
          
          // Trim string values
          if (typeof value === 'string' && (key === 'firstName' || key === 'lastName')) {
            values.push(value.trim());
          } else {
            values.push(value);
          }
          paramIndex++;
        }
      }

      // If no valid updates provided, fetch and return the existing user
      if (setClauses.length === 0) {
        const existingUser = await this.findById(id);
        if (!existingUser) {
          throw new NotFoundError(`User with ID ${id} not found.`);
        }
        return existingUser;
      }

      // Add updated_at timestamp
      setClauses.push(`updated_at = $${paramIndex}`);
      values.push(this.getCurrentTimestamp());
      paramIndex++;

      // Add WHERE clause parameter
      values.push(id);

      const query = `
        UPDATE users
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING 
          id, 
          email, 
          password,
          first_name, 
          last_name, 
          created_at, 
          updated_at, 
          is_active,
          last_login_at;
      `;

      const result = await client.query(query, values);
      
      if (result.rowCount === 0) {
        throw new NotFoundError(`User with ID ${id} not found.`);
      }

      return this.dbRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Updates the last login timestamp for a user
   * @param id The ID of the user to update
   * @returns A Promise that resolves with the updated user
   * @throws {NotFoundError} If the user with the given ID is not found.
   */
  async updateLastLogin(id: string): Promise<User> {
    if (!id) {
      throw new NotFoundError('User ID is required');
    }

    const client = await this.pool.connect();
    try {
      const currentTime = this.getCurrentTimestamp();
      
      const query = `
        UPDATE users
        SET 
          last_login_at = $1,
          updated_at = $2
        WHERE id = $3
        RETURNING 
          id, 
          email, 
          password,
          first_name, 
          last_name, 
          created_at, 
          updated_at, 
          is_active,
          last_login_at;
      `;

      const result = await client.query(query, [currentTime, currentTime, id]);
      
      if (result.rowCount === 0) {
        throw new NotFoundError(`User with ID ${id} not found.`);
      }

      return this.dbRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  /**
   * Deletes a user from the database.
   * @param id The ID of the user to delete.
   * @returns A Promise that resolves when the user is deleted.
   * @throws {NotFoundError} If the user with the given ID is not found.
   */
  async delete(id: string): Promise<void> {
    if (!id) {
      throw new NotFoundError('User ID is required');
    }

    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM users WHERE id = $1;';
      const result = await client.query(query, [id]);
      
      if (result.rowCount === 0) {
        throw new NotFoundError(`User with ID ${id} not found.`);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Get all users (for admin/debugging purposes)
   * @returns A Promise that resolves with all users
   */
  async findAll(): Promise<User[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          id, 
          email, 
          password,
          first_name, 
          last_name, 
          created_at, 
          updated_at, 
          is_active,
          last_login_at 
        FROM users 
        ORDER BY created_at DESC;
      `;
      
      const result = await client.query(query);
      return result.rows.map(row => this.dbRowToUser(row));
    } finally {
      client.release();
    }
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
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE is_active = true) as active_users,
          COUNT(*) FILTER (WHERE is_active = false) as inactive_users
        FROM users;
      `;
      
      const result = await client.query(query);
      const row = result.rows[0];
      
      return {
        totalUsers: parseInt(row.total_users, 10),
        activeUsers: parseInt(row.active_users, 10),
        inactiveUsers: parseInt(row.inactive_users, 10),
      };
    } finally {
      client.release();
    }
  }
}