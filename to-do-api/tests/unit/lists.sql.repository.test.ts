/**
 * Lists SQL Repository Unit Tests
 * @fileoverview Tests for the PostgreSQL lists repository implementation
 */


import { Pool, PoolClient } from 'pg';
import { ListsSqlRepository } from '../../src/repositories/sql/lists.sql.repository';
import { CreateListInput, UpdateListInput, List } from '../../src/models/list.model';
import { ValidationError, NotFoundError, CustomError } from '../../src/utils/errors';

// Mock pg module
jest.mock('pg', () => ({
    Pool: jest.fn()
  }));
  
  describe('ListsSqlRepository', () => {
    let repository: ListsSqlRepository;
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
      repository = new ListsSqlRepository(mockPool);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe('create', () => {
      it('should create a new list successfully', async () => {
        // Arrange
        const listData: CreateListInput = {
          userId: 'user-123',
          name: 'Test List',
          description: 'Test description'
        };
  
        const mockResult = {
          rows: [{
            id: 'list-123',
            user_id: 'user-123',
            name: 'Test List',
            description: 'Test description',
            created_at: '2025-07-05T14:30:57.000Z',
            updated_at: '2025-07-05T14:30:57.000Z'
          }],
          command: 'INSERT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act
        const result = await repository.create(listData);
  
        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe('list-123');
        expect(result.userId).toBe('user-123');
        expect(result.name).toBe('Test List');
        expect(result.description).toBe('Test description');
        expect(result.taskCount).toBe(0);
        expect(result.completedTaskCount).toBe(0);
        expect(result.createdAt).toBe('2025-07-05T14:30:57.000Z');
        expect(result.updatedAt).toBe('2025-07-05T14:30:57.000Z');
        expect(mockClient.query).toHaveBeenCalledTimes(1);
        expect(mockClient.release).toHaveBeenCalledTimes(1);
      });
  
      it('should create list without description', async () => {
        // Arrange
        const listData: CreateListInput = {
          userId: 'user-123',
          name: 'Test List'
        };
  
        const mockResult = {
          rows: [{
            id: 'list-123',
            user_id: 'user-123',
            name: 'Test List',
            description: null,
            created_at: '2025-07-05T14:30:57.000Z',
            updated_at: '2025-07-05T14:30:57.000Z'
          }],
          command: 'INSERT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act
        const result = await repository.create(listData);
  
        // Assert
        expect(result.description).toBeUndefined();
      });
  
      it('should handle database foreign key constraint error', async () => {
        // Arrange
        const listData: CreateListInput = {
          userId: 'invalid-user',
          name: 'Test List'
        };
  
        const dbError = new Error('Foreign key violation') as any;
        dbError.code = '23503';
        (mockClient.query as jest.Mock).mockRejectedValueOnce(dbError);
  
        // Act & Assert
        await expect(repository.create(listData)).rejects.toThrow(ValidationError);
        await expect(repository.create(listData)).rejects.toThrow('Invalid user ID');
        expect(mockClient.release).toHaveBeenCalledTimes(1);
      });
  
      it('should throw ValidationError for invalid input', async () => {
        // Arrange
        const listData: CreateListInput = {
          userId: '',
          name: 'Test List'
        };
  
        // Act & Assert
        await expect(repository.create(listData)).rejects.toThrow(ValidationError);
        await expect(repository.create(listData)).rejects.toThrow('Name and userId are required');
        expect(mockClient.query).not.toHaveBeenCalled();
        expect(mockClient.release).toHaveBeenCalledTimes(1);
      });
  
      it('should throw CustomError for general database errors', async () => {
        // Arrange
        const listData: CreateListInput = {
          userId: 'user-123',
          name: 'Test List'
        };
  
        (mockClient.query as jest.Mock).mockRejectedValueOnce(new Error('Database connection error'));
  
        // Act & Assert
        await expect(repository.create(listData)).rejects.toThrow(CustomError);
        await expect(repository.create(listData)).rejects.toThrow('Failed to create list');
        expect(mockClient.release).toHaveBeenCalledTimes(1);
      });
  
      it('should validate name length', async () => {
        // Arrange
        const listData: CreateListInput = {
          userId: 'user-123',
          name: 'a'.repeat(101)
        };
  
        // Act & Assert
        await expect(repository.create(listData)).rejects.toThrow(ValidationError);
        await expect(repository.create(listData)).rejects.toThrow('List name cannot exceed 100 characters');
      });
  
      it('should validate description length', async () => {
        // Arrange
        const listData: CreateListInput = {
          userId: 'user-123',
          name: 'Test List',
          description: 'a'.repeat(501)
        };
  
        // Act & Assert
        await expect(repository.create(listData)).rejects.toThrow(ValidationError);
        await expect(repository.create(listData)).rejects.toThrow('List description cannot exceed 500 characters');
      });
    });
  
    describe('findByUserId', () => {
      it('should return all lists for a user with task counts', async () => {
        // Arrange
        const userId = 'user-123';
        const mockResult = {
          rows: [
            {
              id: 'list-1',
              user_id: 'user-123',
              name: 'List 1',
              description: 'Description 1',
              created_at: '2025-07-05T14:30:57.000Z',
              updated_at: '2025-07-05T14:30:57.000Z',
              task_count: '2',
              completed_task_count: '1'
            },
            {
              id: 'list-2',
              user_id: 'user-123',
              name: 'List 2',
              description: null,
              created_at: '2025-07-05T14:30:55.000Z',
              updated_at: '2025-07-05T14:30:55.000Z',
              task_count: '0',
              completed_task_count: '0'
            }
          ],
          command: 'SELECT',
          rowCount: 2,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act
        const result = await repository.findByUserId(userId);
  
        // Assert
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('list-1');
        expect(result[0].taskCount).toBe(2);
        expect(result[0].completedTaskCount).toBe(1);
        expect(result[0].description).toBe('Description 1');
        expect(result[1].id).toBe('list-2');
        expect(result[1].taskCount).toBe(0);
        expect(result[1].completedTaskCount).toBe(0);
        expect(result[1].description).toBeUndefined();
        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT'),
          [userId]
        );
      });
  
      it('should return empty array when user has no lists', async () => {
        // Arrange
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
        const result = await repository.findByUserId(userId);
  
        // Assert
        expect(result).toEqual([]);
      });
  
      it('should throw ValidationError when userId is empty', async () => {
        // Act & Assert
        await expect(repository.findByUserId('')).rejects.toThrow(ValidationError);
        await expect(repository.findByUserId('')).rejects.toThrow('User ID is required');
        expect(mockClient.query).not.toHaveBeenCalled();
      });
  
      it('should handle database errors', async () => {
        // Arrange
        const userId = 'user-123';
        (mockClient.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
  
        // Act & Assert
        await expect(repository.findByUserId(userId)).rejects.toThrow(CustomError);
        await expect(repository.findByUserId(userId)).rejects.toThrow('Failed to retrieve user lists');
      });
    });
  
    describe('findById', () => {
      it('should return list by id with task counts', async () => {
        // Arrange
        const listId = 'list-123';
        const mockResult = {
          rows: [{
            id: 'list-123',
            user_id: 'user-123',
            name: 'Test List',
            description: 'Test description',
            created_at: '2025-07-05T14:30:57.000Z',
            updated_at: '2025-07-05T14:30:57.000Z',
            task_count: '3',
            completed_task_count: '1'
          }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act
        const result = await repository.findById(listId);
  
        // Assert
        expect(result).toBeDefined();
        expect(result!.id).toBe('list-123');
        expect(result!.taskCount).toBe(3);
        expect(result!.completedTaskCount).toBe(1);
        expect(result!.createdAt).toBe('2025-07-05T14:30:57.000Z');
        expect(result!.updatedAt).toBe('2025-07-05T14:30:57.000Z');
      });
  
      it('should return null when list not found', async () => {
        // Arrange
        const listId = 'nonexistent-list';
        const mockResult = {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act
        const result = await repository.findById(listId);
  
        // Assert
        expect(result).toBeNull();
      });
  
      it('should validate user ownership when userId provided', async () => {
        // Arrange
        const listId = 'list-123';
        const userId = 'user-456';
        const mockResult = {
          rows: [{
            id: 'list-123',
            user_id: 'user-123', // Different user
            name: 'Test List',
            description: 'Test description',
            created_at: '2025-07-05T14:30:57.000Z',
            updated_at: '2025-07-05T14:30:57.000Z',
            task_count: '0',
            completed_task_count: '0'
          }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act & Assert
        await expect(repository.findById(listId, userId)).rejects.toThrow(CustomError);
        await expect(repository.findById(listId, userId)).rejects.toThrow('User does not own this list');
      });
  
      it('should include user filter in query when userId provided', async () => {
        // Arrange
        const listId = 'list-123';
        const userId = 'user-123';
        const mockResult = {
          rows: [{
            id: 'list-123',
            user_id: 'user-123',
            name: 'Test List',
            description: 'Test description',
            created_at: '2025-07-05T14:30:57.000Z',
            updated_at: '2025-07-05T14:30:57.000Z',
            task_count: '0',
            completed_task_count: '0'
          }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act
        const result = await repository.findById(listId, userId);
  
        // Assert
        expect(result).toBeDefined();
        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining('AND l.user_id = $2'),
          [listId, userId]
        );
      });
  
      it('should throw ValidationError when id is empty', async () => {
        // Act & Assert
        await expect(repository.findById('')).rejects.toThrow(ValidationError);
        await expect(repository.findById('')).rejects.toThrow('List ID is required');
      });
    });
  
    describe('update', () => {
      it('should update list successfully', async () => {
        // Arrange
        const listId = 'list-123';
        const userId = 'user-123';
        const updates: UpdateListInput = {
          name: 'Updated List',
          description: 'Updated description'
        };
  
        // Mock the findById call for ownership check
        const findByIdMockResult = {
          rows: [{
            id: 'list-123',
            user_id: 'user-123',
            name: 'Original List',
            description: 'Original description',
            created_at: '2025-07-05T14:30:57.000Z',
            updated_at: '2025-07-05T14:30:57.000Z',
            task_count: '0',
            completed_task_count: '0'
          }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        // Mock the update query result
        const updateMockResult = {
          rows: [{
            id: 'list-123',
            user_id: 'user-123',
            name: 'Updated List',
            description: 'Updated description',
            created_at: '2025-07-05T14:30:57.000Z',
            updated_at: '2025-07-05T14:31:00.000Z'
          }],
          command: 'UPDATE',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        // Mock final findById call for returning updated list with counts
        const finalMockResult = {
          rows: [{
            id: 'list-123',
            user_id: 'user-123',
            name: 'Updated List',
            description: 'Updated description',
            created_at: '2025-07-05T14:30:57.000Z',
            updated_at: '2025-07-05T14:31:00.000Z',
            task_count: '0',
            completed_task_count: '0'
          }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock)
          .mockResolvedValueOnce(findByIdMockResult) // Initial findById for ownership check
          .mockResolvedValueOnce(updateMockResult)   // Update query
          .mockResolvedValueOnce(finalMockResult);   // Final findById for return
  
        // Act
        const result = await repository.update(listId, updates, userId);
  
        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe('Updated List');
        expect(result.description).toBe('Updated description');
        expect(result.updatedAt).toBe('2025-07-05T14:31:00.000Z');
        expect(mockClient.query).toHaveBeenCalledTimes(3);
      });
  
      it('should throw NotFoundError when list does not exist', async () => {
        // Arrange
        const listId = 'nonexistent-list';
        const userId = 'user-123';
        const updates: UpdateListInput = { name: 'Updated List' };
  
        const mockResult = {
          rows: [],
          command: 'SELECT',
          rowCount: 0,
          oid: 0,
          fields: []
        };
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act & Assert
        await expect(repository.update(listId, updates, userId)).rejects.toThrow(NotFoundError);
        await expect(repository.update(listId, updates, userId)).rejects.toThrow('List not found');
      });
  
      it('should throw ValidationError when no valid updates provided', async () => {
        // Arrange
        const listId = 'list-123';
        const userId = 'user-123';
        const updates: UpdateListInput = {}; // No updates
  
        // Mock findById for ownership check
        const findByIdMockResult = {
          rows: [{
            id: 'list-123',
            user_id: 'user-123',
            name: 'Original List',
            description: 'Original description',
            created_at: '2025-07-05T14:30:57.000Z',
            updated_at: '2025-07-05T14:30:57.000Z',
            task_count: '0',
            completed_task_count: '0'
          }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(findByIdMockResult);
  
        // Act & Assert
        await expect(repository.update(listId, updates, userId)).rejects.toThrow(ValidationError);
        await expect(repository.update(listId, updates, userId)).rejects.toThrow('No valid updates provided');
      });
  
      it('should validate input parameters', async () => {
        // Arrange
        const updates: UpdateListInput = { name: 'Updated List' };
  
        // Act & Assert
        await expect(repository.update('', updates, 'user-123')).rejects.toThrow(ValidationError);
        await expect(repository.update('list-123', updates, '')).rejects.toThrow(ValidationError);
      });
  
      it('should validate name length', async () => {
        // Arrange
        const listId = 'list-123';
        const userId = 'user-123';
        const updates: UpdateListInput = {
          name: 'a'.repeat(101)
        };
  
        // Act & Assert
        await expect(repository.update(listId, updates, userId)).rejects.toThrow(ValidationError);
        await expect(repository.update(listId, updates, userId)).rejects.toThrow('List name cannot exceed 100 characters');
      });
  
      it('should validate description length', async () => {
        // Arrange
        const listId = 'list-123';
        const userId = 'user-123';
        const updates: UpdateListInput = {
          description: 'a'.repeat(501)
        };
  
        // Act & Assert
        await expect(repository.update(listId, updates, userId)).rejects.toThrow(ValidationError);
        await expect(repository.update(listId, updates, userId)).rejects.toThrow('List description cannot exceed 500 characters');
      });
    });
  
    describe('delete', () => {
      it('should delete list successfully with cascade', async () => {
        // Arrange
        const listId = 'list-123';
        const userId = 'user-123';
  
        const beginResult = { command: 'BEGIN', rowCount: 0, oid: 0, fields: [], rows: [] };
        const checkResult = { rows: [{ id: 'list-123' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] };
        const deleteTasksResult = { rows: [], command: 'DELETE', rowCount: 2, oid: 0, fields: [] };
        const deleteListResult = { rows: [], command: 'DELETE', rowCount: 1, oid: 0, fields: [] };
        const commitResult = { command: 'COMMIT', rowCount: 0, oid: 0, fields: [], rows: [] };
  
        (mockClient.query as jest.Mock)
          .mockResolvedValueOnce(beginResult)        // BEGIN transaction
          .mockResolvedValueOnce(checkResult)        // Check ownership
          .mockResolvedValueOnce(deleteTasksResult)  // Delete tasks
          .mockResolvedValueOnce(deleteListResult)   // Delete list
          .mockResolvedValueOnce(commitResult);      // COMMIT transaction
  
        // Act
        await repository.delete(listId, userId);
  
        // Assert
        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.query).toHaveBeenCalledTimes(5);
      });
  
      it('should rollback transaction on error', async () => {
        // Arrange
        const listId = 'list-123';
        const userId = 'user-123';
  
        const beginResult = { command: 'BEGIN', rowCount: 0, oid: 0, fields: [], rows: [] };
        const rollbackResult = { command: 'ROLLBACK', rowCount: 0, oid: 0, fields: [], rows: [] };
  
        (mockClient.query as jest.Mock)
          .mockResolvedValueOnce(beginResult)        // BEGIN transaction
          .mockRejectedValueOnce(new Error('Database error')) // Error during operation
          .mockResolvedValueOnce(rollbackResult);    // ROLLBACK transaction
  
        // Act & Assert
        await expect(repository.delete(listId, userId)).rejects.toThrow(CustomError);
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      });
  
      it('should throw NotFoundError when list does not exist', async () => {
        // Arrange
        const listId = 'nonexistent-list';
        const userId = 'user-123';
  
        const beginResult = { command: 'BEGIN', rowCount: 0, oid: 0, fields: [], rows: [] };
        const checkResult = { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] }; // No list found
        const rollbackResult = { command: 'ROLLBACK', rowCount: 0, oid: 0, fields: [], rows: [] };
  
        (mockClient.query as jest.Mock)
          .mockResolvedValueOnce(beginResult)
          .mockResolvedValueOnce(checkResult)
          .mockResolvedValueOnce(rollbackResult);
  
        // Act & Assert
        await expect(repository.delete(listId, userId)).rejects.toThrow(NotFoundError);
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      });
  
      it('should validate input parameters', async () => {
        // Act & Assert
        await expect(repository.delete('', 'user-123')).rejects.toThrow(ValidationError);
        await expect(repository.delete('list-123', '')).rejects.toThrow(ValidationError);
      });
    });
  
    describe('countByUserId', () => {
      it('should return correct count', async () => {
        // Arrange
        const userId = 'user-123';
        const mockResult = {
          rows: [{ count: '5' }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act
        const result = await repository.countByUserId(userId);
  
        // Assert
        expect(result).toBe(5);
        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining('COUNT(*)'),
          [userId]
        );
      });
  
      it('should return 0 when user has no lists', async () => {
        // Arrange
        const userId = 'user-123';
        const mockResult = {
          rows: [{ count: '0' }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act
        const result = await repository.countByUserId(userId);
  
        // Assert
        expect(result).toBe(0);
      });
  
      it('should throw ValidationError when userId is empty', async () => {
        // Act & Assert
        await expect(repository.countByUserId('')).rejects.toThrow(ValidationError);
        expect(mockClient.query).not.toHaveBeenCalled();
      });
  
      it('should handle database errors', async () => {
        // Arrange
        const userId = 'user-123';
        (mockClient.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
  
        // Act & Assert
        await expect(repository.countByUserId(userId)).rejects.toThrow(CustomError);
      });
    });
  
    describe('error handling', () => {
      it('should always release client connection', async () => {
        // Arrange
        const listData: CreateListInput = {
          userId: 'user-123',
          name: 'Test List'
        };
  
        (mockClient.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
  
        // Act & Assert
        await expect(repository.create(listData)).rejects.toThrow();
        expect(mockClient.release).toHaveBeenCalledTimes(1);
      });
  
      it('should handle database connection errors', async () => {
        // Arrange
        (mockPool.connect as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));
  
        // Act & Assert
        await expect(repository.findByUserId('user-123')).rejects.toThrow();
      });
    });
  
    describe('row mapping', () => {
      it('should correctly map database rows to List objects', async () => {
        // Arrange
        const listId = 'list-123';
        const mockResult = {
          rows: [{
            id: 'list-123',
            user_id: 'user-123',
            name: 'Test List',
            description: 'Test description',
            created_at: '2025-07-05T14:30:57.000Z',
            updated_at: '2025-07-05T14:30:57.000Z',
            task_count: '5',
            completed_task_count: '3'
          }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act
        const result = await repository.findById(listId);
  
        // Assert
        expect(result).toEqual({
          id: 'list-123',
          userId: 'user-123',
          name: 'Test List',
          description: 'Test description',
          createdAt: '2025-07-05T14:30:57.000Z',
          updatedAt: '2025-07-05T14:30:57.000Z',
          taskCount: 5,
          completedTaskCount: 3
        });
      });
  
      it('should handle null description in database', async () => {
        // Arrange
        const listId = 'list-123';
        const mockResult = {
          rows: [{
            id: 'list-123',
            user_id: 'user-123',
            name: 'Test List',
            description: null,
            created_at: '2025-07-05T14:30:57.000Z',
            updated_at: '2025-07-05T14:30:57.000Z',
            task_count: '0',
            completed_task_count: '0'
          }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act
        const result = await repository.findById(listId);
  
        // Assert
        expect(result!.description).toBeUndefined();
      });
  
      it('should handle zero task counts', async () => {
        // Arrange
        const listId = 'list-123';
        const mockResult = {
          rows: [{
            id: 'list-123',
            user_id: 'user-123',
            name: 'Test List',
            description: 'Test description',
            created_at: '2025-07-05T14:30:57.000Z',
            updated_at: '2025-07-05T14:30:57.000Z',
            task_count: null,
            completed_task_count: null
          }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: []
        };
  
        (mockClient.query as jest.Mock).mockResolvedValueOnce(mockResult);
  
        // Act
        const result = await repository.findById(listId);
  
        // Assert
        expect(result!.taskCount).toBe(0);
        expect(result!.completedTaskCount).toBe(0);
      });
    });
  });