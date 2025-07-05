/**
 * Lists Memory Repository Unit Tests
 * @fileoverview Tests for the in-memory lists repository implementation
 */

import { ListsMemoryRepository } from '../../src/repositories/memory/lists.memory.repository';
import { CreateListInput, UpdateListInput, List } from '../../src/models/list.model';
import { Task } from '../../src/models/task.model';
import { ValidationError, NotFoundError, CustomError } from '../../src/utils/errors';


describe('ListsMemoryRepository', () => {
  let repository: ListsMemoryRepository;
  let tasksStore: Map<string, Task>;

  beforeEach(() => {
    tasksStore = new Map();
    repository = new ListsMemoryRepository(tasksStore);
  });

  afterEach(async () => {
    await repository.clear();
    tasksStore.clear();
  });

  describe('create', () => {
    it('should create a new list successfully', async () => {
      // Arrange
      const listData: CreateListInput = {
        userId: 'user-123',
        name: 'Test List',
        description: 'Test description'
      };

      // Act
      const result = await repository.create(listData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.userId).toBe(listData.userId);
      expect(result.name).toBe(listData.name);
      expect(result.description).toBe(listData.description);
      expect(result.taskCount).toBe(0);
      expect(result.completedTaskCount).toBe(0);
      expect(result.createdAt).toBeTruthy();
      expect(result.updatedAt).toBeTruthy();
      expect(typeof result.createdAt).toBe('string');
      expect(typeof result.updatedAt).toBe('string');
    });

    it('should create a list without description', async () => {
      // Arrange
      const listData: CreateListInput = {
        userId: 'user-123',
        name: 'Test List'
      };

      // Act
      const result = await repository.create(listData);

      // Assert
      expect(result).toBeDefined();
      expect(result.description).toBeUndefined();
    });

    it('should trim whitespace from name and description', async () => {
      // Arrange
      const listData: CreateListInput = {
        userId: 'user-123',
        name: '  Test List  ',
        description: '  Test description  '
      };

      // Act
      const result = await repository.create(listData);

      // Assert
      expect(result.name).toBe('Test List');
      expect(result.description).toBe('Test description');
    });

    it('should throw ValidationError when name is missing', async () => {
      // Arrange
      const listData: CreateListInput = {
        userId: 'user-123',
        name: '',
        description: 'Test description'
      };

      // Act & Assert
      await expect(repository.create(listData)).rejects.toThrow(ValidationError);
      await expect(repository.create(listData)).rejects.toThrow('Name and userId are required');
    });

    it('should throw ValidationError when userId is missing', async () => {
      // Arrange
      const listData: CreateListInput = {
        userId: '',
        name: 'Test List',
        description: 'Test description'
      };

      // Act & Assert
      await expect(repository.create(listData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when name exceeds 100 characters', async () => {
      // Arrange
      const listData: CreateListInput = {
        userId: 'user-123',
        name: 'a'.repeat(101),
        description: 'Test description'
      };

      // Act & Assert
      await expect(repository.create(listData)).rejects.toThrow(ValidationError);
      await expect(repository.create(listData)).rejects.toThrow('List name cannot exceed 100 characters');
    });

    it('should throw ValidationError when description exceeds 500 characters', async () => {
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
    it('should return all lists for a user', async () => {
      // Arrange
      const userId = 'user-123';
      const list1 = await repository.create({
        userId,
        name: 'List 1',
        description: 'Description 1'
      });
      const list2 = await repository.create({
        userId,
        name: 'List 2',
        description: 'Description 2'
      });

      // Create a list for different user
      await repository.create({
        userId: 'user-456',
        name: 'Other List'
      });

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(l => l.id)).toContain(list1.id);
      expect(result.map(l => l.id)).toContain(list2.id);
      expect(result.every(l => l.userId === userId)).toBe(true);
    });

    it('should return lists sorted by creation date (newest first)', async () => {
      // Arrange
      const userId = 'user-123';
      
      // Create lists with slight delay to ensure different timestamps
      const list1 = await repository.create({
        userId,
        name: 'First List'
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const list2 = await repository.create({
        userId,
        name: 'Second List'
      });

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(list2.id); // Second list should be first (newest)
      expect(result[1].id).toBe(list1.id); // First list should be second
    });

    it('should return empty array when user has no lists', async () => {
      // Act
      const result = await repository.findByUserId('nonexistent-user');

      // Assert
      expect(result).toEqual([]);
    });

    it('should include task counts in results', async () => {
      // Arrange
      const userId = 'user-123';
      const list = await repository.create({
        userId,
        name: 'Test List'
      });

      // Add some mock tasks
      const task1: Task = {
        id: 'task-1',
        listId: list.id,
        userId,
        title: 'Task 1',
        description: 'Description 1',
        isCompleted: false,
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deadline: undefined,
        completedAt: undefined
      };

      const task2: Task = {
        id: 'task-2',
        listId: list.id,
        userId,
        title: 'Task 2',
        description: 'Description 2',
        isCompleted: true,
        priority: 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deadline: undefined,
        completedAt: new Date().toISOString()
      };

      tasksStore.set('task-1', task1);
      tasksStore.set('task-2', task2);

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].taskCount).toBe(2);
      expect(result[0].completedTaskCount).toBe(1);
    });

    it('should throw ValidationError when userId is empty', async () => {
      // Act & Assert
      await expect(repository.findByUserId('')).rejects.toThrow(ValidationError);
      await expect(repository.findByUserId('')).rejects.toThrow('User ID is required');
    });
  });

  describe('findById', () => {
    it('should return list by id', async () => {
      // Arrange
      const listData: CreateListInput = {
        userId: 'user-123',
        name: 'Test List',
        description: 'Test description'
      };
      const createdList = await repository.create(listData);

      // Act
      const result = await repository.findById(createdList.id);

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(createdList.id);
      expect(result!.name).toBe(listData.name);
      expect(result!.description).toBe(listData.description);
    });

    it('should return null when list not found', async () => {
      // Act
      const result = await repository.findById('nonexistent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should validate user ownership when userId provided', async () => {
      // Arrange
      const list = await repository.create({
        userId: 'user-123',
        name: 'Test List'
      });

      // Act & Assert - should work for owner
      const result = await repository.findById(list.id, 'user-123');
      expect(result).toBeDefined();

      // Act & Assert - should throw error for non-owner
      await expect(repository.findById(list.id, 'user-456')).rejects.toThrow(CustomError);
      await expect(repository.findById(list.id, 'user-456')).rejects.toThrow('User does not own this list');
    });

    it('should include task counts in result', async () => {
      // Arrange
      const userId = 'user-123';
      const list = await repository.create({
        userId,
        name: 'Test List'
      });

      // Add a mock task
      const task: Task = {
        id: 'task-1',
        listId: list.id,
        userId,
        title: 'Task 1',
        description: 'Description 1',
        isCompleted: true,
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deadline: undefined,
        completedAt: new Date().toISOString()
      };
      tasksStore.set('task-1', task);

      // Act
      const result = await repository.findById(list.id);

      // Assert
      expect(result).toBeDefined();
      expect(result!.taskCount).toBe(1);
      expect(result!.completedTaskCount).toBe(1);
    });

    it('should throw ValidationError when id is empty', async () => {
      // Act & Assert
      await expect(repository.findById('')).rejects.toThrow(ValidationError);
      await expect(repository.findById('')).rejects.toThrow('List ID is required');
    });
  });

  describe('update', () => {
    let existingList: List;

    beforeEach(async () => {
      existingList = await repository.create({
        userId: 'user-123',
        name: 'Original List',
        description: 'Original description'
      });
    });

    it('should update list name successfully', async () => {
      // Arrange
      const updates: UpdateListInput = {
        name: 'Updated List'
      };

      // Act
      const result = await repository.update(existingList.id, updates, 'user-123');

      // Assert
      expect(result.name).toBe('Updated List');
      expect(result.description).toBe('Original description'); // Should remain unchanged
      expect(result.updatedAt).not.toBe(existingList.updatedAt);
    });

    it('should update list description successfully', async () => {
      // Arrange
      const updates: UpdateListInput = {
        description: 'Updated description'
      };

      // Act
      const result = await repository.update(existingList.id, updates, 'user-123');

      // Assert
      expect(result.name).toBe('Original List'); // Should remain unchanged
      expect(result.description).toBe('Updated description');
    });

    it('should update both name and description', async () => {
      // Arrange
      const updates: UpdateListInput = {
        name: 'Updated List',
        description: 'Updated description'
      };

      // Act
      const result = await repository.update(existingList.id, updates, 'user-123');

      // Assert
      expect(result.name).toBe('Updated List');
      expect(result.description).toBe('Updated description');
    });

    it('should trim whitespace from updates', async () => {
      // Arrange
      const updates: UpdateListInput = {
        name: '  Updated List  ',
        description: '  Updated description  '
      };

      // Act
      const result = await repository.update(existingList.id, updates, 'user-123');

      // Assert
      expect(result.name).toBe('Updated List');
      expect(result.description).toBe('Updated description');
    });

    it('should throw NotFoundError when list does not exist', async () => {
      // Arrange
      const updates: UpdateListInput = {
        name: 'Updated List'
      };

      // Act & Assert
      await expect(repository.update('nonexistent-id', updates, 'user-123')).rejects.toThrow(NotFoundError);
      await expect(repository.update('nonexistent-id', updates, 'user-123')).rejects.toThrow('List not found');
    });

    it('should throw CustomError when user does not own the list', async () => {
      // Arrange
      const updates: UpdateListInput = {
        name: 'Updated List'
      };

      // Act & Assert
      await expect(repository.update(existingList.id, updates, 'user-456')).rejects.toThrow(CustomError);
      await expect(repository.update(existingList.id, updates, 'user-456')).rejects.toThrow('User does not own this list');
    });

    it('should throw ValidationError when name is empty', async () => {
      // Arrange
      const updates: UpdateListInput = {
        name: '   '
      };

      // Act & Assert
      await expect(repository.update(existingList.id, updates, 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.update(existingList.id, updates, 'user-123')).rejects.toThrow('List name cannot be empty');
    });

    it('should throw ValidationError when name exceeds 100 characters', async () => {
      // Arrange
      const updates: UpdateListInput = {
        name: 'a'.repeat(101)
      };

      // Act & Assert
      await expect(repository.update(existingList.id, updates, 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.update(existingList.id, updates, 'user-123')).rejects.toThrow('List name cannot exceed 100 characters');
    });

    it('should throw ValidationError when description exceeds 500 characters', async () => {
      // Arrange
      const updates: UpdateListInput = {
        description: 'a'.repeat(501)
      };

      // Act & Assert
      await expect(repository.update(existingList.id, updates, 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.update(existingList.id, updates, 'user-123')).rejects.toThrow('List description cannot exceed 500 characters');
    });

    it('should throw ValidationError when required parameters are missing', async () => {
      // Arrange
      const updates: UpdateListInput = {
        name: 'Updated List'
      };

      // Act & Assert
      await expect(repository.update('', updates, 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.update(existingList.id, updates, '')).rejects.toThrow(ValidationError);
    });
  });

  describe('delete', () => {
    let existingList: List;

    beforeEach(async () => {
      existingList = await repository.create({
        userId: 'user-123',
        name: 'Test List',
        description: 'Test description'
      });
    });

    it('should delete list successfully', async () => {
      // Act
      await repository.delete(existingList.id, 'user-123');

      // Assert - list should no longer exist
      const result = await repository.findById(existingList.id);
      expect(result).toBeNull();
    });

    it('should throw NotFoundError when list does not exist', async () => {
      // Act & Assert
      await expect(repository.delete('nonexistent-id', 'user-123')).rejects.toThrow(NotFoundError);
      await expect(repository.delete('nonexistent-id', 'user-123')).rejects.toThrow('List not found');
    });

    it('should throw CustomError when user does not own the list', async () => {
      // Act & Assert
      await expect(repository.delete(existingList.id, 'user-456')).rejects.toThrow(CustomError);
      await expect(repository.delete(existingList.id, 'user-456')).rejects.toThrow('User does not own this list');
    });

    it('should throw ValidationError when required parameters are missing', async () => {
      // Act & Assert
      await expect(repository.delete('', 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.delete(existingList.id, '')).rejects.toThrow(ValidationError);
    });
  });

  describe('countByUserId', () => {
    it('should return correct count of user lists', async () => {
      // Arrange
      const userId = 'user-123';
      await repository.create({ userId, name: 'List 1' });
      await repository.create({ userId, name: 'List 2' });
      await repository.create({ userId, name: 'List 3' });

      // Create list for different user
      await repository.create({ userId: 'user-456', name: 'Other List' });

      // Act
      const count = await repository.countByUserId(userId);

      // Assert
      expect(count).toBe(3);
    });

    it('should return 0 when user has no lists', async () => {
      // Act
      const count = await repository.countByUserId('nonexistent-user');

      // Assert
      expect(count).toBe(0);
    });

    it('should throw ValidationError when userId is empty', async () => {
      // Act & Assert
      await expect(repository.countByUserId('')).rejects.toThrow(ValidationError);
      await expect(repository.countByUserId('')).rejects.toThrow('User ID is required');
    });
  });

  describe('task count integration', () => {
    it('should correctly calculate task counts across multiple lists', async () => {
      // Arrange
      const userId = 'user-123';
      const list1 = await repository.create({ userId, name: 'List 1' });
      const list2 = await repository.create({ userId, name: 'List 2' });

      // Add tasks to list1
      tasksStore.set('task-1', {
        id: 'task-1',
        listId: list1.id,
        userId,
        title: 'Task 1',
        isCompleted: false,
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deadline: undefined,
        completedAt: undefined,
        description: undefined
      });

      tasksStore.set('task-2', {
        id: 'task-2',
        listId: list1.id,
        userId,
        title: 'Task 2',
        isCompleted: true,
        priority: 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deadline: undefined,
        completedAt: new Date().toISOString(),
        description: undefined
      });

      // Add task to list2
      tasksStore.set('task-3', {
        id: 'task-3',
        listId: list2.id,
        userId,
        title: 'Task 3',
        isCompleted: false,
        priority: 'low',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deadline: undefined,
        completedAt: undefined,
        description: undefined
      });

      // Act
      const lists = await repository.findByUserId(userId);

      // Assert
      const foundList1 = lists.find(l => l.id === list1.id);
      const foundList2 = lists.find(l => l.id === list2.id);

      expect(foundList1!.taskCount).toBe(2);
      expect(foundList1!.completedTaskCount).toBe(1);
      expect(foundList2!.taskCount).toBe(1);
      expect(foundList2!.completedTaskCount).toBe(0);
    });
  });

  describe('utility methods', () => {
    it('should clear all data', async () => {
      // Arrange
      await repository.create({ userId: 'user-123', name: 'Test List' });

      // Act
      await repository.clear();

      // Assert
      const lists = await repository.getAll();
      expect(lists).toHaveLength(0);
    });

    it('should return all lists for debugging', async () => {
      // Arrange
      await repository.create({ userId: 'user-123', name: 'List 1' });
      await repository.create({ userId: 'user-456', name: 'List 2' });

      // Act
      const allLists = await repository.getAll();

      // Assert
      expect(allLists).toHaveLength(2);
    });

    it('should allow setting tasks store', () => {
      // Arrange
      const newTasksStore = new Map<string, Task>();
      
      // Act
      repository.setTasksStore(newTasksStore);

      // Assert - This is mainly for code coverage, hard to test directly
      expect(() => repository.setTasksStore(newTasksStore)).not.toThrow();
    });
  });
});