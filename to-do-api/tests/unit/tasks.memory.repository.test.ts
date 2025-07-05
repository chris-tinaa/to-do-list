/**
 * Tasks Memory Repository Unit Tests
 * @fileoverview Tests for the in-memory tasks repository implementation
 */

import { TasksMemoryRepository } from '../../src/repositories/memory/tasks.memory.repository';
import { CreateTaskInput, UpdateTaskInput, Task } from '../../src/models/task.model';
import { ValidationError, NotFoundError, CustomError } from '../../src/utils/errors';

describe('TasksMemoryRepository', () => {
  let repository: TasksMemoryRepository;
  let tasksStore: Map<string, Task>;

  beforeEach(() => {
    tasksStore = new Map();
    repository = new TasksMemoryRepository(tasksStore);
  });

  afterEach(async () => {
    await repository.clear();
    tasksStore.clear();
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

      // Act
      const result = await repository.create(taskData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.listId).toBe(taskData.listId);
      expect(result.userId).toBe(taskData.userId);
      expect(result.title).toBe(taskData.title);
      expect(result.description).toBe(taskData.description);
      expect(result.deadline).toBe(taskData.deadline);
      expect(result.priority).toBe(taskData.priority);
      expect(result.isCompleted).toBe(false);
      expect(result.completedAt).toBeNull();
      expect(result.createdAt).toBeTruthy();
      expect(result.updatedAt).toBeTruthy();
      expect(typeof result.createdAt).toBe('string');
      expect(typeof result.updatedAt).toBe('string');
      
      // Verify ISO 8601 format
      expect(() => new Date(result.createdAt)).not.toThrow();
      expect(() => new Date(result.updatedAt)).not.toThrow();
    });

    it('should create a task without optional fields', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task'
      };

      // Act
      const result = await repository.create(taskData);

      // Assert
      expect(result).toBeDefined();
      expect(result.description).toBeUndefined();
      expect(result.deadline).toBeUndefined();
      expect(result.priority).toBeUndefined();
    });

    it('should trim whitespace from title and description', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: '  Test Task  ',
        description: '  Test description  '
      };

      // Act
      const result = await repository.create(taskData);

      // Assert
      expect(result.title).toBe('Test Task');
      expect(result.description).toBe('Test description');
    });

    it('should throw ValidationError when title is missing', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: ''
      };

      // Act & Assert
      await expect(repository.create(taskData)).rejects.toThrow(ValidationError);
      await expect(repository.create(taskData)).rejects.toThrow('Title, listId, and userId are required');
    });

    it('should throw ValidationError when listId is missing', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: '',
        userId: 'user-123',
        title: 'Test Task'
      };

      // Act & Assert
      await expect(repository.create(taskData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when userId is missing', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: '',
        title: 'Test Task'
      };

      // Act & Assert
      await expect(repository.create(taskData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when title exceeds 200 characters', async () => {
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

    it('should throw ValidationError when description exceeds 1000 characters', async () => {
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

    it('should throw ValidationError for invalid deadline format', async () => {
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

    it('should throw ValidationError for invalid priority', async () => {
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
  });

  describe('findByListId', () => {
    it('should return all tasks for a specific list', async () => {
      // Arrange
      const userId = 'user-123';
      const listId = 'list-123';
      
      const task1 = await repository.create({
        listId,
        userId,
        title: 'Task 1'
      });
      
      const task2 = await repository.create({
        listId,
        userId,
        title: 'Task 2'
      });

      // Create task for different list
      await repository.create({
        listId: 'list-456',
        userId,
        title: 'Other Task'
      });

      // Act
      const result = await repository.findByListId(listId, userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toContain(task1.id);
      expect(result.map(t => t.id)).toContain(task2.id);
      expect(result.every(t => t.listId === listId)).toBe(true);
      expect(result.every(t => t.userId === userId)).toBe(true);
    });

    it('should return tasks sorted by creation date (newest first)', async () => {
      // Arrange
      const userId = 'user-123';
      const listId = 'list-123';
      
      const task1 = await repository.create({
        listId,
        userId,
        title: 'First Task'
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const task2 = await repository.create({
        listId,
        userId,
        title: 'Second Task'
      });

      // Act
      const result = await repository.findByListId(listId, userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(task2.id); // Second task should be first (newest)
      expect(result[1].id).toBe(task1.id); // First task should be second
    });

    it('should return empty array when list has no tasks', async () => {
      // Act
      const result = await repository.findByListId('empty-list', 'user-123');

      // Assert
      expect(result).toEqual([]);
    });

    it('should only return tasks for the specified user', async () => {
      // Arrange
      const listId = 'list-123';
      
      await repository.create({
        listId,
        userId: 'user-123',
        title: 'User 123 Task'
      });

      await repository.create({
        listId,
        userId: 'user-456',
        title: 'User 456 Task'
      });

      // Act
      const result = await repository.findByListId(listId, 'user-123');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('User 123 Task');
    });

    it('should throw ValidationError when listId is empty', async () => {
      // Act & Assert
      await expect(repository.findByListId('', 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.findByListId('', 'user-123')).rejects.toThrow('List ID and user ID are required');
    });

    it('should throw ValidationError when userId is empty', async () => {
      // Act & Assert
      await expect(repository.findByListId('list-123', '')).rejects.toThrow(ValidationError);
    });
  });

  describe('findById', () => {
    it('should return task by id', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task',
        description: 'Test description'
      };
      const createdTask = await repository.create(taskData);

      // Act
      const result = await repository.findById(createdTask.id, 'user-123');

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(createdTask.id);
      expect(result!.title).toBe(taskData.title);
      expect(result!.description).toBe(taskData.description);
    });

    it('should return null when task not found', async () => {
      // Act
      const result = await repository.findById('nonexistent-id', 'user-123');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw CustomError when user does not own the task', async () => {
      // Arrange
      const task = await repository.create({
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task'
      });

      // Act & Assert
      await expect(repository.findById(task.id, 'user-456')).rejects.toThrow(CustomError);
      await expect(repository.findById(task.id, 'user-456')).rejects.toThrow('User does not own this task');
    });

    it('should throw ValidationError when required parameters are missing', async () => {
      // Act & Assert
      await expect(repository.findById('', 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.findById('task-123', '')).rejects.toThrow(ValidationError);
    });
  });

  describe('update', () => {
    let existingTask: Task;

    beforeEach(async () => {
      existingTask = await repository.create({
        listId: 'list-123',
        userId: 'user-123',
        title: 'Original Task',
        description: 'Original description',
        priority: 'low'
      });
    });

    it('should update task title successfully', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        title: 'Updated Task'
      };

      // Act
      const result = await repository.update(existingTask.id, updates, 'user-123');

      // Assert
      expect(result.title).toBe('Updated Task');
      expect(result.description).toBe('Original description'); // Should remain unchanged
      expect(result.updatedAt).not.toBe(existingTask.updatedAt);
    });

    it('should update task description successfully', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        description: 'Updated description'
      };

      // Act
      const result = await repository.update(existingTask.id, updates, 'user-123');

      // Assert
      expect(result.title).toBe('Original Task'); // Should remain unchanged
      expect(result.description).toBe('Updated description');
    });

    it('should update task deadline successfully', async () => {
      // Arrange
      const deadline = '2025-07-15T14:40:30.000Z';
      const updates: UpdateTaskInput = {
        deadline
      };

      // Act
      const result = await repository.update(existingTask.id, updates, 'user-123');

      // Assert
      expect(result.deadline).toBe(deadline);
    });

    it('should update task priority successfully', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        priority: 'high'
      };

      // Act
      const result = await repository.update(existingTask.id, updates, 'user-123');

      // Assert
      expect(result.priority).toBe('high');
    });

    it('should update task completion status successfully', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        isCompleted: true
      };

      // Act
      const result = await repository.update(existingTask.id, updates, 'user-123');

      // Assert
      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).toBeTruthy();
      expect(typeof result.completedAt).toBe('string');
    });

    it('should set completedAt to null when marking as incomplete', async () => {
      // Arrange
      // First mark as completed
      await repository.update(existingTask.id, { isCompleted: true }, 'user-123');
      
      const updates: UpdateTaskInput = {
        isCompleted: false
      };

      // Act
      const result = await repository.update(existingTask.id, updates, 'user-123');

      // Assert
      expect(result.isCompleted).toBe(false);
      expect(result.completedAt).toBeNull();
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        title: 'Updated Task',
        description: 'Updated description',
        priority: 'high',
        isCompleted: true
      };

      // Act
      const result = await repository.update(existingTask.id, updates, 'user-123');

      // Assert
      expect(result.title).toBe('Updated Task');
      expect(result.description).toBe('Updated description');
      expect(result.priority).toBe('high');
      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).toBeTruthy();
    });

    it('should trim whitespace from updates', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        title: '  Updated Task  ',
        description: '  Updated description  '
      };

      // Act
      const result = await repository.update(existingTask.id, updates, 'user-123');

      // Assert
      expect(result.title).toBe('Updated Task');
      expect(result.description).toBe('Updated description');
    });

    it('should throw NotFoundError when task does not exist', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        title: 'Updated Task'
      };

      // Act & Assert
      await expect(repository.update('nonexistent-id', updates, 'user-123')).rejects.toThrow(NotFoundError);
      await expect(repository.update('nonexistent-id', updates, 'user-123')).rejects.toThrow('Task not found');
    });

    it('should throw CustomError when user does not own the task', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        title: 'Updated Task'
      };

      // Act & Assert
      await expect(repository.update(existingTask.id, updates, 'user-456')).rejects.toThrow(CustomError);
      await expect(repository.update(existingTask.id, updates, 'user-456')).rejects.toThrow('User does not own this task');
    });

    it('should throw ValidationError when title is empty', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        title: '   '
      };

      // Act & Assert
      await expect(repository.update(existingTask.id, updates, 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.update(existingTask.id, updates, 'user-123')).rejects.toThrow('Task title cannot be empty');
    });

    it('should throw ValidationError when title exceeds 200 characters', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        title: 'a'.repeat(201)
      };

      // Act & Assert
      await expect(repository.update(existingTask.id, updates, 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.update(existingTask.id, updates, 'user-123')).rejects.toThrow('Task title cannot exceed 200 characters');
    });

    it('should throw ValidationError when description exceeds 1000 characters', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        description: 'a'.repeat(1001)
      };

      // Act & Assert
      await expect(repository.update(existingTask.id, updates, 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.update(existingTask.id, updates, 'user-123')).rejects.toThrow('Task description cannot exceed 1000 characters');
    });

    it('should throw ValidationError for invalid deadline format', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        deadline: 'invalid-date'
      };

      // Act & Assert
      await expect(repository.update(existingTask.id, updates, 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.update(existingTask.id, updates, 'user-123')).rejects.toThrow('Invalid deadline format. Use ISO 8601 format');
    });

    it('should throw ValidationError for invalid priority', async () => {
      // Arrange
      const updates: UpdateTaskInput = {
        priority: 'invalid' as any
      };

      // Act & Assert
      await expect(repository.update(existingTask.id, updates, 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.update(existingTask.id, updates, 'user-123')).rejects.toThrow('Priority must be low, medium, or high');
    });
  });

  describe('delete', () => {
    let existingTask: Task;

    beforeEach(async () => {
      existingTask = await repository.create({
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task'
      });
    });

    it('should delete task successfully', async () => {
      // Act
      await repository.delete(existingTask.id, 'user-123');

      // Assert - task should no longer exist
      const result = await repository.findById(existingTask.id, 'user-123');
      expect(result).toBeNull();
    });

    it('should throw NotFoundError when task does not exist', async () => {
      // Act & Assert
      await expect(repository.delete('nonexistent-id', 'user-123')).rejects.toThrow(NotFoundError);
      await expect(repository.delete('nonexistent-id', 'user-123')).rejects.toThrow('Task not found');
    });

    it('should throw CustomError when user does not own the task', async () => {
      // Act & Assert
      await expect(repository.delete(existingTask.id, 'user-456')).rejects.toThrow(CustomError);
      await expect(repository.delete(existingTask.id, 'user-456')).rejects.toThrow('User does not own this task');
    });

    it('should throw ValidationError when required parameters are missing', async () => {
      // Act & Assert
      await expect(repository.delete('', 'user-123')).rejects.toThrow(ValidationError);
      await expect(repository.delete(existingTask.id, '')).rejects.toThrow(ValidationError);
    });
  });

  describe('markComplete', () => {
    it('should mark task as completed', async () => {
      // Arrange
      const task = await repository.create({
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task'
      });

      // Act
      const result = await repository.markComplete(task.id, 'user-123');

      // Assert
      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).toBeTruthy();
      expect(typeof result.completedAt).toBe('string');
    });

    it('should throw error when task not found', async () => {
      // Act & Assert
      await expect(repository.markComplete('nonexistent-id', 'user-123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('markIncomplete', () => {
    it('should mark task as incomplete', async () => {
      // Arrange
      const task = await repository.create({
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task'
      });

      // First mark as completed
      await repository.markComplete(task.id, 'user-123');

      // Act
      const result = await repository.markIncomplete(task.id, 'user-123');

      // Assert
      expect(result.isCompleted).toBe(false);
      expect(result.completedAt).toBeNull();
    });

    it('should throw error when task not found', async () => {
      // Act & Assert
      await expect(repository.markIncomplete('nonexistent-id', 'user-123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findDueThisWeek', () => {
    beforeEach(() => {
      // Mock current date to 2025-07-05T14:40:30.000Z
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-07-05T14:40:30.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return tasks due within the current week', async () => {
      // Arrange
      const userId = 'user-123';
      
      // Task due tomorrow (within week)
      const task1 = await repository.create({
        listId: 'list-123',
        userId,
        title: 'Due Tomorrow',
        deadline: '2025-07-06T14:40:30.000Z'
      });

      // Task due in 5 days (within week)
      const task2 = await repository.create({
        listId: 'list-123',
        userId,
        title: 'Due in 5 days',
        deadline: '2025-07-10T14:40:30.000Z'
      });

      // Task due in 10 days (outside week)
      await repository.create({
        listId: 'list-123',
        userId,
        title: 'Due in 10 days',
        deadline: '2025-07-15T14:40:30.000Z'
      });

      // Completed task due this week (should be excluded)
      const completedTask = await repository.create({
        listId: 'list-123',
        userId,
        title: 'Completed Task',
        deadline: '2025-07-07T14:40:30.000Z'
      });
      await repository.markComplete(completedTask.id, userId);

      // Task with no deadline
      await repository.create({
        listId: 'list-123',
        userId,
        title: 'No deadline'
      });

      // Act
      const result = await repository.findDueThisWeek(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toContain(task1.id);
      expect(result.map(t => t.id)).toContain(task2.id);
      expect(result.every(t => !t.isCompleted)).toBe(true);
      
      // Should be sorted by deadline (soonest first)
      expect(result[0].id).toBe(task1.id);
      expect(result[1].id).toBe(task2.id);
    });

    it('should return empty array when no tasks due this week', async () => {
      // Arrange
      const userId = 'user-123';
      
      // Task due next month
      await repository.create({
        listId: 'list-123',
        userId,
        title: 'Due next month',
        deadline: '2025-08-05T14:40:30.000Z'
      });

      // Act
      const result = await repository.findDueThisWeek(userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw ValidationError when userId is empty', async () => {
      // Act & Assert
      await expect(repository.findDueThisWeek('')).rejects.toThrow(ValidationError);
      await expect(repository.findDueThisWeek('')).rejects.toThrow('User ID is required');
    });
  });

  describe('findByUserId', () => {
    let userId: string;

    beforeEach(async () => {
      userId = 'user-123';
      
      // Create test tasks
      await repository.create({
        listId: 'list-123',
        userId,
        title: 'High Priority Task',
        priority: 'high',
        deadline: '2025-07-10T14:40:30.000Z'
      });

      await repository.create({
        listId: 'list-123',
        userId,
        title: 'Medium Priority Task',
        priority: 'medium',
        deadline: '2025-07-08T14:40:30.000Z'
      });

      const completedTask = await repository.create({
        listId: 'list-123',
        userId,
        title: 'Completed Task',
        priority: 'low'
      });
      await repository.markComplete(completedTask.id, userId);

      // Task for different user
      await repository.create({
        listId: 'list-123',
        userId: 'user-456',
        title: 'Other User Task'
      });
    });

    it('should return all tasks for a user', async () => {
      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.every(t => t.userId === userId)).toBe(true);
    });

    it('should filter tasks by completion status', async () => {
      // Act
      const completedTasks = await repository.findByUserId(userId, { isCompleted: true });
      const pendingTasks = await repository.findByUserId(userId, { isCompleted: false });

      // Assert
      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].title).toBe('Completed Task');
      expect(pendingTasks).toHaveLength(2);
      expect(pendingTasks.every(t => !t.isCompleted)).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      // Act
      const highPriorityTasks = await repository.findByUserId(userId, { priority: 'high' });
      const mediumPriorityTasks = await repository.findByUserId(userId, { priority: 'medium' });

      // Assert
      expect(highPriorityTasks).toHaveLength(1);
      expect(highPriorityTasks[0].title).toBe('High Priority Task');
      expect(mediumPriorityTasks).toHaveLength(1);
      expect(mediumPriorityTasks[0].title).toBe('Medium Priority Task');
    });

    it('should sort tasks by deadline', async () => {
      // Act
      const result = await repository.findByUserId(userId, {
        sortBy: 'deadline',
        sortOrder: 'asc'
      });

      // Assert
      expect(result).toHaveLength(3);
      // Tasks with deadlines should come first, sorted by deadline
      expect(result[0].title).toBe('Medium Priority Task'); // 2025-07-08
      expect(result[1].title).toBe('High Priority Task');   // 2025-07-10
      expect(result[2].title).toBe('Completed Task');       // No deadline (comes last)
    });

    it('should sort tasks by priority', async () => {
      // Act
      const result = await repository.findByUserId(userId, {
        sortBy: 'priority',
        sortOrder: 'desc'
      });

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].priority).toBe('high');   // 3
      expect(result[1].priority).toBe('medium'); // 2
      expect(result[2].priority).toBe('low');    // 1
    });

    it('should sort tasks by title', async () => {
      // Act
      const result = await repository.findByUserId(userId, {
        sortBy: 'title',
        sortOrder: 'asc'
      });

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Completed Task');
      expect(result[1].title).toBe('High Priority Task');
      expect(result[2].title).toBe('Medium Priority Task');
    });

    it('should apply pagination', async () => {
      // Act
      const firstPage = await repository.findByUserId(userId, { limit: 2, offset: 0 });
      const secondPage = await repository.findByUserId(userId, { limit: 2, offset: 2 });

      // Assert
      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(1);
      
      // Should not overlap
      const firstPageIds = firstPage.map(t => t.id);
      const secondPageIds = secondPage.map(t => t.id);
      expect(firstPageIds.some(id => secondPageIds.includes(id))).toBe(false);
    });

    it('should combine filters and sorting', async () => {
      // Act
      const result = await repository.findByUserId(userId, {
        isCompleted: false,
        sortBy: 'priority',
        sortOrder: 'desc'
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(t => !t.isCompleted)).toBe(true);
      expect(result[0].priority).toBe('high');
      expect(result[1].priority).toBe('medium');
    });

    it('should throw ValidationError when userId is empty', async () => {
      // Act & Assert
      await expect(repository.findByUserId('')).rejects.toThrow(ValidationError);
      await expect(repository.findByUserId('')).rejects.toThrow('User ID is required');
    });
  });

  describe('countByUserId', () => {
    it('should return correct count of user tasks', async () => {
      // Arrange
      const userId = 'user-123';
      
      await repository.create({ listId: 'list-123', userId, title: 'Task 1' });
      await repository.create({ listId: 'list-123', userId, title: 'Task 2' });
      await repository.create({ listId: 'list-123', userId, title: 'Task 3' });

      // Create task for different user
      await repository.create({ listId: 'list-123', userId: 'user-456', title: 'Other Task' });

      // Act
      const count = await repository.countByUserId(userId);

      // Assert
      expect(count).toBe(3);
    });

    it('should return 0 when user has no tasks', async () => {
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

  describe('countCompletedByUserId', () => {
    it('should return correct count of completed tasks', async () => {
      // Arrange
      const userId = 'user-123';
      
      const task1 = await repository.create({ listId: 'list-123', userId, title: 'Task 1' });
      const task2 = await repository.create({ listId: 'list-123', userId, title: 'Task 2' });
      await repository.create({ listId: 'list-123', userId, title: 'Task 3' }); // Not completed

      // Mark two tasks as completed
      await repository.markComplete(task1.id, userId);
      await repository.markComplete(task2.id, userId);

      // Act
      const count = await repository.countCompletedByUserId(userId);

      // Assert
      expect(count).toBe(2);
    });

    it('should return 0 when user has no completed tasks', async () => {
      // Arrange
      const userId = 'user-123';
      await repository.create({ listId: 'list-123', userId, title: 'Incomplete Task' });

      // Act
      const count = await repository.countCompletedByUserId(userId);

      // Assert
      expect(count).toBe(0);
    });

    it('should throw ValidationError when userId is empty', async () => {
      // Act & Assert
      await expect(repository.countCompletedByUserId('')).rejects.toThrow(ValidationError);
      await expect(repository.countCompletedByUserId('')).rejects.toThrow('User ID is required');
    });
  });

  describe('utility methods', () => {
    it('should clear all data', async () => {
      // Arrange
      await repository.create({ listId: 'list-123', userId: 'user-123', title: 'Test Task' });

      // Act
      await repository.clear();

      // Assert
      const tasks = await repository.getAll();
      expect(tasks).toHaveLength(0);
    });

    it('should return all tasks for debugging', async () => {
      // Arrange
      await repository.create({ listId: 'list-123', userId: 'user-123', title: 'Task 1' });
      await repository.create({ listId: 'list-456', userId: 'user-456', title: 'Task 2' });

      // Act
      const allTasks = await repository.getAll();

      // Assert
      expect(allTasks).toHaveLength(2);
    });

    it('should allow setting tasks store', () => {
      // Arrange
      const newTasksStore = new Map<string, Task>();
      
      // Act
      repository.setTasksStore(newTasksStore);

      // Assert - This is mainly for code coverage
      expect(() => repository.setTasksStore(newTasksStore)).not.toThrow();
    });
  });

  describe('edge cases and validation', () => {
    it('should handle tasks with maximum allowed title length', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: 'a'.repeat(200) // Exactly at limit
      };

      // Act
      const result = await repository.create(taskData);

      // Assert
      expect(result.title).toHaveLength(200);
    });

    it('should handle tasks with maximum allowed description length', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task',
        description: 'a'.repeat(1000) // Exactly at limit
      };

      // Act
      const result = await repository.create(taskData);

      // Assert
      expect(result.description).toHaveLength(1000);
    });

    it('should handle tasks with all priority levels', async () => {
      // Arrange & Act
      const lowTask = await repository.create({
        listId: 'list-123',
        userId: 'user-123',
        title: 'Low Priority',
        priority: 'low'
      });

      const mediumTask = await repository.create({
        listId: 'list-123',
        userId: 'user-123',
        title: 'Medium Priority',
        priority: 'medium'
      });

      const highTask = await repository.create({
        listId: 'list-123',
        userId: 'user-123',
        title: 'High Priority',
        priority: 'high'
      });

      // Assert
      expect(lowTask.priority).toBe('low');
      expect(mediumTask.priority).toBe('medium');
      expect(highTask.priority).toBe('high');
    });

    it('should handle edge case deadline dates', async () => {
      // Arrange
      const taskData: CreateTaskInput = {
        listId: 'list-123',
        userId: 'user-123',
        title: 'Test Task',
        deadline: '2025-12-31T23:59:59.999Z' // End of year
      };

      // Act
      const result = await repository.create(taskData);

      // Assert
      expect(result.deadline).toBe('2025-12-31T23:59:59.999Z');
    });
  });
});