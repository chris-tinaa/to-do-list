/**
 * User Model
 * @fileoverview Data types and interfaces for user entities
 * Current Date and Time (UTC): 2025-07-05 15:16:17
 * Current User: chris-tinaa
 */

export interface User {
  id: string;
  email: string;
  password: string; // Hashed password
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLoginAt: Date | null;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  password?: string;
  isActive?: boolean;
}

export interface UserFilters {
  isActive?: boolean;
  email?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface UserSearchResult {
  users: UserResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentRegistrations: number; // Users registered in last 30 days
  lastActivity: Date | null;
}