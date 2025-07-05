import { UserRepository } from '../../src/repositories/interfaces/user.repository.interface';
import { ConflictError, NotFoundError } from '../../src/utils/errors';
import { User } from '../../src/models/user.model';
import { UserMemoryRepository } from '../../src/repositories/memory/user.memory.repository';
import { UserSQLRepository } from '../../src/repositories/sql/user.sql.repository';
import { Pool } from 'pg';

// Mock getDatabaseConfig to control which repository is used
jest.mock('../../src/config/database.config', () => ({
  getDatabaseConfig: jest.fn(),
}));

// Mock uuidv4 to ensure consistent IDs for testing in memory and SQL repositories where UUIDs are generated
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

const mockPoolQuery = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockPoolQuery,
  })),
  Client: jest.fn(),
}));

describe('User Repository', () => {
  // Test suite for UserMemoryRepository
  describe('UserMemoryRepository', () => {
    let userRepository: UserRepository;

    beforeEach(() => {
      const { UserMemoryRepository: ActualUserMemoryRepository } = require('../../src/repositories/memory/user.memory.repository');
      userRepository = new ActualUserMemoryRepository();
    });

    it('should create and find a user', async () => {
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLoginAt'> = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };
      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.id).toBe('mock-uuid');
      expect(user.isActive).toBe(true);

      const foundUser = await userRepository.findById(user.id);
      expect(foundUser).toEqual(user);
    });

    it('should find a user by email', async () => {
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLoginAt'> = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };
      const user = await userRepository.create(userData);
      const foundUser = await userRepository.findByEmail(userData.email);
      expect(foundUser).toEqual(user);
    });

    it('should return null if user not found by ID', async () => {
      const foundUser = await userRepository.findById('non-existent-id');
      expect(foundUser).toBeNull();
    });

    it('should return null if user not found by email', async () => {
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });

    it('should throw ConflictError if user with email already exists', async () => {
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLoginAt'> = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };
      await userRepository.create(userData);
      await expect(userRepository.create(userData)).rejects.toThrow(ConflictError);
    });

    it('should throw an error if required fields are missing during creation', async () => {
      const invalidUserData = {
        email: 'invalid@example.com',
        password: 'password123',
        firstName: 'John',
        // lastName is missing
      } as Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLoginAt'>;
      await expect(userRepository.create(invalidUserData)).rejects.toThrow('Missing required user fields');
    });

    it('should update a user', async () => {
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLoginAt'> = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };
      const user = await userRepository.create(userData);
      const updatedFirstName = 'Jane';
      const updatedUser = await userRepository.update(user.id, { firstName: updatedFirstName });
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser.firstName).toBe(updatedFirstName);
      expect(typeof updatedUser.updatedAt).toBe('string');
      expect(new Date(updatedUser.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(user.updatedAt).getTime());

      const foundUser = await userRepository.findById(user.id);
      expect(foundUser?.firstName).toBe(updatedFirstName);
    });

    it('should throw NotFoundError when updating a non-existent user', async () => {
      await expect(userRepository.update('non-existent-id', { firstName: 'Jane' })).rejects.toThrow(NotFoundError);
    });

    it('should delete a user', async () => {
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLoginAt'> = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };
      const user = await userRepository.create(userData);
      await userRepository.delete(user.id);
      const foundUser = await userRepository.findById(user.id);
      expect(foundUser).toBeNull();
    });

    it('should throw NotFoundError when deleting a non-existent user', async () => {
      await expect(userRepository.delete('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  // Test suite for UserSQLRepository - Mocked
  describe('UserSQLRepository (Mocked)', () => {
    let userRepository: UserRepository;
    let mockGetDatabaseConfig: jest.Mock;
    let ActualConflictError: any;
    let ActualNotFoundError: any;

    beforeEach(() => {
      mockPoolQuery.mockClear();
      mockGetDatabaseConfig = require('../../src/config/database.config').getDatabaseConfig;
      mockGetDatabaseConfig.mockReturnValue({ inMemory: false, database: 'testdb' });
      ActualConflictError = jest.requireActual('../../src/utils/errors').ConflictError;
      ActualNotFoundError = jest.requireActual('../../src/utils/errors').NotFoundError;
      const { Pool } = require('pg');
      const mockPool = new Pool();
      userRepository = new UserSQLRepository(mockPool);
    });

    it('should create a user', async () => {
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLoginAt'> = {
        email: 'sqltest@example.com',
        password: 'password123',
        firstName: 'SQL',
        lastName: 'User',
      };
      const returnedDbUser = {
        id: 'mock-uuid',
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        last_login_at: null,
      };

      mockPoolQuery.mockResolvedValueOnce({ rows: [returnedDbUser] });

      const user = await userRepository.create(userData);

      expect(user).toEqual({
        id: returnedDbUser.id,
        email: returnedDbUser.email,
        password: returnedDbUser.password,
        firstName: returnedDbUser.first_name,
        lastName: returnedDbUser.last_name,
        createdAt: returnedDbUser.created_at.toISOString(),
        updatedAt: returnedDbUser.updated_at.toISOString(),
        isActive: returnedDbUser.is_active,
        lastLoginAt: returnedDbUser.last_login_at,
      });
    });

    it('should throw ConflictError if email already exists during creation', async () => {
      const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLoginAt'> = {
        email: 'sqltest@example.com',
        password: 'password123',
        firstName: 'SQL',
        lastName: 'User',
      };
      mockPoolQuery.mockRejectedValueOnce({ code: '23505', message: 'duplicate key value violates unique constraint' });
      await expect(userRepository.create(userData)).rejects.toThrow(ActualConflictError);
    });

    it('should throw an error if required fields are missing during creation', async () => {
      const invalidUserData = {
        email: 'invalid@example.com',
        password: 'password123',
        firstName: 'John',
      } as Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'lastLoginAt'>;
      await expect(userRepository.create(invalidUserData)).rejects.toThrow('Missing required user fields');
    });

    it('should find a user by email', async () => {
      const expectedDbUser = {
        id: 'mock-uuid',
        email: 'sqlfind@example.com',
        password: 'password123',
        first_name: 'SQL',
        last_name: 'Find',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        last_login_at: null,
      };
      mockPoolQuery.mockResolvedValueOnce({ rows: [expectedDbUser] });

      const foundUser = await userRepository.findByEmail('sqlfind@example.com');
      expect(foundUser).toEqual({
        id: expectedDbUser.id,
        email: expectedDbUser.email,
        password: expectedDbUser.password,
        firstName: expectedDbUser.first_name,
        lastName: expectedDbUser.last_name,
        createdAt: expectedDbUser.created_at.toISOString(),
        updatedAt: expectedDbUser.updated_at.toISOString(),
        isActive: expectedDbUser.is_active,
        lastLoginAt: expectedDbUser.last_login_at,
      });
    });

    it('should return null if user not found by email', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });

    it('should find a user by ID', async () => {
      const expectedDbUser = {
        id: 'mock-uuid',
        email: 'sqlidfind@example.com',
        password: 'password123',
        first_name: 'SQL ID',
        last_name: 'Find',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        last_login_at: null,
      };
      mockPoolQuery.mockResolvedValueOnce({ rows: [expectedDbUser] });

      const foundUser = await userRepository.findById('mock-uuid');
      expect(foundUser).toEqual({
        id: expectedDbUser.id,
        email: expectedDbUser.email,
        password: expectedDbUser.password,
        firstName: expectedDbUser.first_name,
        lastName: expectedDbUser.last_name,
        createdAt: expectedDbUser.created_at.toISOString(),
        updatedAt: expectedDbUser.updated_at.toISOString(),
        isActive: expectedDbUser.is_active,
        lastLoginAt: expectedDbUser.last_login_at,
      });
    });

    it('should return null if user not found by ID', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      const foundUser = await userRepository.findById('non-existent-id');
      expect(foundUser).toBeNull();
    });

    it('should update a user', async () => {
      const initialDbUser = {
        id: 'mock-uuid',
        email: 'sqlupdate@example.com',
        password: 'password123',
        first_name: 'Old',
        last_name: 'Name',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        last_login_at: null,
      };
      const updatedDbUser = {
        ...initialDbUser,
        first_name: 'New',
        last_name: 'LastName',
        updated_at: new Date(),
      };
    
      // ONLY mock the UPDATE call, not a prior SELECT
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 1, rows: [updatedDbUser] });
    
      const updatedUser = await userRepository.update('mock-uuid', { firstName: 'New', lastName: 'LastName' });
    
      expect(updatedUser.firstName).toBe('New');
      expect(updatedUser.lastName).toBe('LastName');
      expect(updatedUser.password).toBe(initialDbUser.password);
      expect(new Date(updatedUser.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(initialDbUser.updated_at).getTime());
    });
    

    it('should return the existing user if no updates are provided', async () => {
      const existingDbUser = {
        id: 'mock-uuid',
        email: 'sqlupdate@example.com',
        password: 'password123',
        first_name: 'Existing',
        last_name: 'User',
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        last_login_at: null,
      };
      mockPoolQuery.mockResolvedValueOnce({ rows: [existingDbUser] }); // Only one call
    
      const user = await userRepository.update('mock-uuid', {});
      expect(user.firstName).toBe('Existing');
      expect(user.password).toBe(existingDbUser.password);
    });
    

    it('should throw NotFoundError when updating a non-existent user', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });
    
      await expect(userRepository.update('non-existent-id', { firstName: 'Jane' })).rejects.toThrow(ActualNotFoundError);
    });
    
    it('should delete a user', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 });
      await userRepository.delete('mock-uuid');
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError when deleting a non-existent user', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 0 });
      await expect(userRepository.delete('non-existent-id')).rejects.toThrow(ActualNotFoundError);
    });
  });
});
