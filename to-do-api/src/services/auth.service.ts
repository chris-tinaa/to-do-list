/**
 * Authentication Service
 * @fileoverview Business logic for user authentication and authorization
 */

import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { getJwtConfig } from '../config/jwt.config';
import { User, CreateUserInput, UserResponse } from '../models/user.model';
import { ValidationError, NotFoundError, UnauthorizedError } from '../utils/errors';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  password?: string;
  isActive?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
  type: 'access';
  iat?: number;
  exp?: number;
}

/**
 * Authentication service class
 * Handles user registration, login, token management, and profile updates
 */
export class AuthService {
  private readonly jwtConfig = getJwtConfig();
  private readonly saltRounds = 12;
  
  // In a real app, this would be a database or external user store
  private users: Map<string, User> = new Map();
  private refreshTokens: Set<string> = new Set();

  constructor() {
    // Initialize with a default user for testing
    this.initializeDefaultUser();
  }

  /**
   * Initialize default user for testing purposes
   */
  private async initializeDefaultUser(): Promise<void> {
    const defaultUser: User = {
      id: 'user_chris_tinaa_001',
      email: 'chris-tinaa@example.com',
      password: await bcrypt.hash('SecurePass123!', this.saltRounds),
      firstName: 'Chris',
      lastName: 'Tinaa',
      isActive: true,
      createdAt: new Date('2025-07-05T15:14:34.000Z'),
      updatedAt: new Date('2025-07-05T15:14:34.000Z'),
      lastLoginAt: null
    };

    this.users.set(defaultUser.id, defaultUser);
  }

  /**
   * Register a new user
   * @param input - User registration data
   * @returns Authentication response with user data and tokens
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = input;

    // Check if user already exists
    const existingUser = Array.from(this.users.values()).find(user => user.email === email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Validate password strength
    this.validatePassword(password);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = {
      id: userId,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      isActive: true,
      createdAt: new Date('2025-07-05T15:14:34.000Z'),
      updatedAt: new Date('2025-07-05T15:14:34.000Z'),
      lastLoginAt: new Date()
    };

    // Save user
    this.users.set(userId, newUser);

    // Generate tokens
    const tokens = await this.generateTokens(newUser);

    // Store refresh token
    this.refreshTokens.add(tokens.refreshToken);

    return {
      user: this.mapUserToResponse(newUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Login user with email and password
   * @param input - Login credentials
   * @returns Authentication response with user data and tokens
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user by email
    const user = Array.from(this.users.values()).find(u => u.email === email.toLowerCase().trim());
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    user.updatedAt = new Date('2025-07-05T15:14:34.000Z');
    this.users.set(user.id, user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store refresh token
    this.refreshTokens.add(tokens.refreshToken);

    return {
      user: this.mapUserToResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Valid refresh token
   * @returns New access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify refresh token exists in our store
    if (!this.refreshTokens.has(refreshToken)) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    try {
      // Verify and decode refresh token
      const payload = jwt.verify(refreshToken, this.jwtConfig.refreshTokenSecret) as RefreshTokenPayload;
      
      // Find user
      const user = this.users.get(payload.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Generate new access token
      const accessToken = await this.generateAccessToken(user);

      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Remove expired refresh token
        this.refreshTokens.delete(refreshToken);
        throw new UnauthorizedError('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Logout user by invalidating refresh token
   * @param refreshToken - Refresh token to invalidate
   */
  async logout(refreshToken: string): Promise<void> {
    this.refreshTokens.delete(refreshToken);
  }

  /**
   * Get user profile by ID
   * @param userId - User ID
   * @returns User profile data
   */
  async getUserProfile(userId: string): Promise<UserResponse> {
    const user = this.users.get(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.mapUserToResponse(user);
  }

  /**
   * Update user profile
   * @param userId - User ID
   * @param input - Profile update data
   * @returns Updated user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserResponse> {
    const user = this.users.get(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update fields if provided
    if (input.firstName !== undefined) {
      user.firstName = input.firstName.trim();
    }

    if (input.lastName !== undefined) {
      user.lastName = input.lastName.trim();
    }

    if (input.password !== undefined) {
      this.validatePassword(input.password);
      user.password = await bcrypt.hash(input.password, this.saltRounds);
    }

    if (input.isActive !== undefined) {
      user.isActive = input.isActive;
    }

    user.updatedAt = new Date('2025-07-05T15:14:34.000Z');

    // Save updated user
    this.users.set(userId, user);

    return this.mapUserToResponse(user);
  }

  /**
   * Verify user exists and is active
   * @param userId - User ID to verify
   * @returns User data if valid
   */
  async verifyUser(userId: string): Promise<UserResponse> {
    const user = this.users.get(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    return this.mapUserToResponse(user);
  }

  /**
   * Generate both access and refresh tokens for a user
   * @param user - User data
   * @returns Token pair
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Generate access token for a user
   * @param user - User data
   * @returns JWT access token
   */
  private async generateAccessToken(user: User): Promise<string> {
    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      type: 'access'
    };

    // Convert time string to seconds (JWT expects seconds, not string)
    const expiresInSeconds = this.parseTimeToSeconds(this.jwtConfig.accessTokenExpiresIn);

    const options: SignOptions = {
      expiresIn: expiresInSeconds,
      issuer: 'task-management-api',
      audience: 'task-management-app',
      subject: user.id
    };

    return jwt.sign(payload, this.jwtConfig.accessTokenSecret, options);
  }

  /**
   * Generate refresh token for a user
   * @param user - User data
   * @returns JWT refresh token
   */
  private async generateRefreshToken(user: User): Promise<string> {
    const tokenId = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      tokenId,
      type: 'refresh'
    };

    // Convert time string to seconds (JWT expects seconds, not string)
    const expiresInSeconds = this.parseTimeToSeconds(this.jwtConfig.refreshTokenExpiresIn);

    const options: SignOptions = {
      expiresIn: expiresInSeconds,
      issuer: 'task-management-api',
      audience: 'task-management-app',
      subject: user.id,
      jwtid: tokenId
    };

    return jwt.sign(payload, this.jwtConfig.refreshTokenSecret, options);
  }

  /**
   * Parse time string to seconds for JWT
   * @param timeString - Time string like "15m", "7d", "1h"
   * @returns Number of seconds
   */
  private parseTimeToSeconds(timeString: string): number {
    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
      // If not a valid format, default to 15 minutes
      return 15 * 60;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 15 * 60; // Default to 15 minutes
    }
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new ValidationError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
    }
  }

  /**
   * Map User model to UserResponse (exclude sensitive fields)
   * @param user - User model
   * @returns User response data
   */
  private mapUserToResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt
    };
  }

  /**
   * Get user statistics (for admin/debugging purposes)
   * @returns User statistics
   */
  async getUserStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    activeRefreshTokens: number;
  }> {
    const allUsers = Array.from(this.users.values());
    const activeUsers = allUsers.filter(user => user.isActive);
    const inactiveUsers = allUsers.filter(user => !user.isActive);

    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      inactiveUsers: inactiveUsers.length,
      activeRefreshTokens: this.refreshTokens.size
    };
  }
}

/**
 * Factory function to create auth service instance
 * @returns Configured auth service
 */
export function createAuthService(): AuthService {
  return new AuthService();
}