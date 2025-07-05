/**
 * Task model interface and related types
 * @fileoverview Defines the Task entity structure and related types
 * @see docs/prd.md section 5.3
 */

/**
 * Task entity interface
 */
export interface Task {
  id: string; // UUID
  listId: string; // UUID
  userId: string; // UUID
  title: string;
  description?: string;
  deadline?: string; // ISO 8601
  isCompleted: boolean;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  completedAt?: string | null; // ISO 8601 or null
}

/**
 * Task creation input interface
 */
export interface CreateTaskInput {
  /** ID of the list this task belongs to */
  listId: string;
  /** ID of the user creating the task */
  userId: string;
  /** Title of the task */
  title: string;
  /** Optional description of the task */
  description?: string;
  /** Optional deadline for the task */
  deadline?: string;
  /** Priority level of the task */
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Task update input interface
 */
export interface UpdateTaskInput {
  /** Updated title of the task */
  title?: string;
  /** Updated description of the task */
  description?: string;
  /** Updated deadline for the task */
  deadline?: string;
  /** Updated priority level of the task */
  priority?: 'low' | 'medium' | 'high';
  /** Updated completion status */
  isCompleted?: boolean;
}

/**
 * Task with basic info (for lightweight operations)
 */
export interface TaskBasic {
  id: string;
  listId: string;
  userId: string;
  title: string;
  description?: string;
  deadline?: string;
  isCompleted: boolean;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

/**
 * Task summary for overview displays
 */
export interface TaskSummary {
  id: string;
  title: string;
  isCompleted: boolean;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string;
  daysUntilDue?: number;
  isOverdue?: boolean;
}

/**
 * Priority levels for tasks
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Task status for filtering
 */
export enum TaskStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  OVERDUE = 'overdue'
}