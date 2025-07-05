/**
 * Tasks SQL Repository Unit Tests
 * @fileoverview Tests for the PostgreSQL tasks repository implementation
 */

import { Pool, PoolClient } from 'pg';
import { TasksSqlRepository } from '.../.../src/repositories/memory/tasks.memory.repository.ts';
import { CreateTaskInput, UpdateTaskInput } from '../../src/models/task.model';
import { ValidationError, NotFoundError, CustomError } from '../../src/utils/errors';

// Mock pg module
jest.mock('pg', () => ({
  Pool: jest.fn()
}));

describe('TasksSqlRepository', () => {
  let repository: TasksSqlRepository;
  let mockPool: jest.Mocked<Pool>;
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(() => {
    // Create mock client with properly typed query method
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    } as any;

    // Create mock pool
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn(),
    } as any;

    // Create repository instance
    repository = new TasksSqlRepository(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new task successfully', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task',
        description: 'Test description',
        deadline: '2025-07-10T14:40:30.000Z',
        priority: 'medium'
      };

      const mockResult = {
        rows: [{
          id: 'task-123',
          list_id: 'list-123',
          user_id: 'user-123',
          title: 'Test Task',
          description: 'Test description',
          deadline: '2025-07-10T14:40:30.000Z',
          is_completed: false,
          priority: 'medium',
          created_at: '2025-07-05T14:40:30.000Z',
          updated_at: '2025-07-05T14:40:30.000Z',
          completed_at: null
        }],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: []
      };

      (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);

      // Act
      const result = await repository.create(taskData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('task-123');
      expect(result.listId).toBe('list-123');
      expect(result.userId).toBe('user-123');
      expect(result.title).toBe('Test Task');
      expect(result.description).toBe('Test description');
      expect(result.deadline).toBe('2025-07-10T14:40:30.000Z');
      expect(result.priority).toBe('medium');
      expect(result.isCompleted).toBe(false);
      expect(result.completedAt).toBeUndefined();
      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should create task without optional fields', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task'
      };

      const mockResult = {
        rows: [{
          id: 'task-123',
          list_id: 'list-123',
          user_id: 'user-123',
          title: 'Test Task',
          description: null,
          deadline: null,
          is_completed: false,
          priority: null,
          created_at: '2025-07-05T14:40:30.000Z',
          updated_at: '2025-07-05T14:40:30.000Z',
          completed_at: null
        }],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: []
      };

      (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);

      // Act
      const result = await repository.create(taskData);

      // Assert
      expect(result.description).toBeUndefined();
      expect(result.deadline).toBeUndefined();
      expect(result.priority).toBeUndefined();
    });

    it('should handle database foreign key constraint error for list_id', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'invalid-list',
        userId: 'user-123',
        title: 'Test Task'
      };

      const dbError = new Error('Foreign key violation') as any;
      dbError.code = '23503';
      dbError.constraint = 'tasks_list_id_fkey';
      (mockClient.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.create(taskData)).rejects.toThrow(ValidationError);
      await expect(repository.create(taskData)).rejects.toThrow('Invalid list ID');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should handle database foreign key constraint error for user_id', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'invalid-user',
        title: 'Test Task'
      };

      const dbError = new Error('Foreign key violation') as any;
      dbError.code = '23503';
      dbError.constraint = 'tasks_user_id_fkey';
      (mockClient.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.create(taskData)).rejects.toThrow(ValidationError);
      await expect(repository.create(taskData)).rejects.toThrow('Invalid user ID');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should throw ValidationError for invalid input', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: '',
        userId: 'user-123',
        title: 'Test Task'
      };

      // Act & Assert
      await expect(repository.create(taskData)).rejects.toThrow(ValidationError);
      await expect(repository.create(taskData)).rejects.toThrow('Title, listId, and userId are required');
      expect(mockClient.query).not.toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should validate title length', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: 'a'.repeat(201)
      };

      // Act & Assert
      await expect(repository.create(taskData)).rejects.toThrow(ValidationError);
      await expect(repository.create(taskData)).rejects.toThrow('Task title cannot exceed 200 characters');
    });

    it('should validate description length', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task',
        description: 'a'.repeat(1001)
      };

      // Act & Assert
      await expect(repository.create(taskData)).rejects.toThrow(ValidationError);
      await expect(repository.create(taskData)).rejects.toThrow('Task description cannot exceed 1000 characters');
    });

    it('should validate deadline format', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task',
        deadline: 'invalid-date'
      };

      // Act & Assert
      await expect(repository.create(taskData)).rejects.toThrow(ValidationError);
      await expect(repository.create(taskData)).rejects.toThrow('Invalid deadline format. Use ISO 8601 format');
    });

    it('should validate priority value', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task',
        priority: 'invalid' as any
      };

      // Act & Assert
      await expect(repository.create(taskData)).rejects.toThrow(ValidationError);
      await expect(repository.create(taskData)).rejects.toThrow('Priority must be low, medium, or high');
    });

    it('should throw CustomError for general database errors', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task'
      };

      (mockClient.query as jest.Mock).mockRejectedValueOnce(new Error('Database connection error'));

      // Act & Assert
      await expect(repository.create(taskData)).rejects.toThrow(CustomError);
      await expect(repository.create(taskData)).rejects.toThrow('Failed to create task');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByListId', () => {
    it('should return all tasks for a specific list', async () => {
      // Arrange
      const listId = 'list-123';
      const userId = 'user-123';
      const mockResult = {
        rows: [
          {
            id: 'task-1',
            list_id: 'list-123',
            user_id: 'user-123',
            title: 'Task 1',
            description: 'Description 1',
            deadline: '2025-07-10T14:40:30.000Z',
            is_completed: false,
            priority: 'high',
            created_at: '2025-07-05T14:40:30.000Z',
            updated_at: '2025-07-05T14:40:30.000Z',
            completed_at: null
          },
          {
            id: 'task-2',
            list_id: 'list-123',
            user_id: 'user-123',
            title: 'Task 2',
            description: null,
            deadline: null,
            is_completed: true,
            priority: 'medium',
            created_at: '2025-07-05T14:35:30.000Z',
            updated_at: '2025-07-05T14:38:30.000Z',
            completed_at: '2025-07-05T14:38:30.000Z'
          }
        ],
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: []
      };

      (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);

      // Act
      const result = await repository.findByListId(listId, userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('task-1');
      expect(result[0].description).toBe('Description 1');
      expect(result[0].deadline).toBe('2025-07-10T14:40:30.000Z');
      expect(result[1].id).toBe('task-2');
      expect(result[1].description).toBeUndefined();
      expect(result[1].deadline).toBeUndefined();
      expect(result[1].isCompleted).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE list_id = $1 AND user_id = $2'),
        [listId, userId]
      );
    });

    it('should return empty array when list has no tasks', async () => {
      // Arrange
      const listId = 'empty-list';
      const userId = 'user-123';
      const mockResult = {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: []
      };

      (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);

      // Act
      const result = await repository.findByListId(listId, userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw ValidationError when parameters are missing', async () => {
      // Act & Assert
      await expect(repository.findByListId('', 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.findByListId('list-123', '')).rejects.toThrow(ValidationError);
    });

    it('should handle database errors', async () => {
      // Arrange
      const listId = 'list-123';
      const userId = 'user-123';
      (mockClient.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      // Act & Assert
      await expect(repository.findByListId(listId, userId)).rejects.toThrow(CustomError);
      await expect(repository.findByListId(listId, userId)).rejects.toThrow('Failed to retrieve list tasks');
    });
  });

  describe('findById', () => {
    it('should return task by id', async () => {
      // Arrange
      const taskId = 'task-123';
      const userId = 'user-123';
      const mockResult = {
        rows: [{
          id: 'task-123',
          list_id: 'list-123',
          user_id: 'user-123',
          title: 'Test Task',
          description: 'Test description',
          deadline: '2025-07-10T14:40:30.000Z',
          is_completed: false,
          priority: 'medium',
          created_at: '2025-07-05T14:40:30.000Z',
          updated_at: '2025-07-05T14:40:30.000Z',
          completed_at: null
        }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      };

      (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);

      // Act
      const result = await repository.findById(taskId, userId);

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe('task-123');
      expect(result!.title).toBe('Test Task');
      expect(result!.description).toBe('Test description');
      expect(result!.deadline).toBe('2025-07-10T14:40:30.000Z');
      expect(result!.priority).toBe('medium');
    });

    it('should return null when task not found', async () => {
      // Arrange
      const taskId = 'nonexistent-task';
      const userId = 'user-123';
      const mockResult = {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: []
      };

      (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);

      // Act
      const result = await repository.findById(taskId, userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw ValidationError when parameters are missing', async () => {
      // Act & Assert
      await expect(repository.findById('', 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.findById('task-123', '')).rejects.toThrow(ValidationError);
    });
  });

  describe('update', () => {
    it('should update task successfully', async () => {
      // Arrange
      const taskId = 'task-123';
      const userId = 'user-123';
      const updates: UpdateTaskInput = {
        title: 'Updated Task',
        description: 'Updated description',
        priority: 'high',
        isCompleted: true
      };

      // Mock the findById call for ownership check
      const findByIdMockResult = {
        rows: [{
          id: 'task-123',
          list_id: 'list-123',
          user_id: 'user-123',
          title: 'Original Task',
          description: 'Original description',
          deadline: null,
          is_completed: false,
          priority: 'medium',
          created_at: '2025-07-05T14:40:30.000Z',
          updated_at: '2025-07-05T14:40:30.000Z',
          completed_at: null
        }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      };

      // Mock the update query result
      const updateMockResult = {
        rows: [{
          id: 'task-123',
          list_id: 'list-123',
          user_id: 'user-123',
          title: 'Updated Task',
          description: 'Updated description',
          deadline: null,
          is_completed: true,
          priority: 'high',
          created_at: '2025-07-05T14:40:30.000Z',
          updated_at: '2025-07-05T14:42:30.000Z',
          completed_at: '2025-07-05T14:42:30.000Z'
        }],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: []
      };

      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce(findByIdMockResult) // Initial findById for ownership check
        .mockResolvedValueOnce(updateMockResult);  // Update query

      // Act
      const result = await repository.update(taskId, updates, userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe('Updated Task');
      expect(result.description).toBe('Updated description');
      expect(result.priority).toBe('high');
      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).toBe('2025-07-05T14:42:30.000Z');
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundError when task does not exist', async () => {
      // Arrange
      const taskId = 'nonexistent-task';
      const userId = 'user-123';
      const updates: UpdateTaskInput = { title: 'Updated Task' };

      const mockResult = {
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: []
      };
      (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);

      // Act & Assert
      await expect(repository.update(taskId, updates, userId)).rejects.toThrow(NotFoundError);
      await expect(repository.update(taskId, updates, userId)).rejects.toThrow('Task not found');
    });

    it('should throw ValidationError when no valid updates provided', async () => {
      // Arrange
      const taskId = 'task-123';
      const userId = 'user-123';
      const updates: UpdateTaskInput = {}; // No updates

      // Mock findById for ownership check
      const findByIdMockResult = {
        rows: [{
          id: 'task-123',
          list_id: 'list-123',
          user_id: 'user-123',
          title: 'Original Task',
          description: 'Original description',
          deadline: null,
          is_completed: false,
          priority: 'medium',
          created_at: '2025-07-05T14:40:30.000Z',
          updated_at: '2025-07-05T14:40:30.000Z',
          completed_at: null
        }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      };

      (mockClient.query as jest.Mock).mockResolvedValueOnce(findByIdMockResult);

      // Act & Assert
      await expect(repository.update(taskId, updates, userId)).rejects.toThrow(ValidationError);
      await expect(repository.update(taskId, updates, userId)).rejects.toThrow('No valid updates provided');
    });

    it('should validate input parameters', async () => {
      // Arrange
      const updates: UpdateTaskInput = { title: 'Updated Task' };

      // Act & Assert
      await expect(repository.update('', updates, 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.update('task-123', updates, '')).rejects.toThrow(ValidationError);
    });

    it('should validate title length', async () => {
      // Arrange
      const taskId = 'task-123';
      const userId = 'user-123';
      const updates: UpdateTaskInput = {
        title: 'a'.repeat(201)
      };

      // Act & Assert
      await expect(repository.update(taskId, updates, userId)).rejects.toThrow(ValidationError);
      await expect(repository.update(taskId, updates, userId)).rejects.toThrow('Task title cannot exceed 200 characters');
    });

    it('should validate description length', async () => {
      // Arrange
      const taskId = 'task-123';
      const userId = 'user-123';
      const updates: UpdateTaskInput = {
        description: 'a'.repeat(1001)
      };

      // Act & Assert
      await expect(repository.update(taskId, updates, userId)).rejects.toThrow(ValidationError);
      await expect(repository.update(taskId, updates, userId)).rejects.toThrow('Task description cannot exceed 1000 characters');
    });

    it('should validate deadline format', async () => {
      // Arrange
      const taskId = 'task-123';
      const userId = 'user-123';
      const updates: UpdateTaskInput = {
        deadline: 'invalid-date'
      };

      // Act & Assert
      await expect(repository.update(taskId, updates, userId)).rejects.toThrow(ValidationError);
      await expect(repository.update(taskId, updates, userId)).rejects.toThrow('Invalid deadline format. Use ISO