import { AuthService } from '../../src/services/auth.service';
import { UserRepository } from '../../src/repositories/interfaces/user.repository.interface';
import { ITokensRepository } from '../../src/repositories/interfaces/tokens.repository.interface';
import { JwtUtil } from '../../src/utils/jwt.util';
import { PasswordUtil } from '../../src/utils/password.util';
import { User } from '../../src/models/user.model';
import { ConflictError, ValidationError } from '../../src/utils/errors';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockTokensRepository: jest.Mocked<ITokensRepository>;
  let mockJwtUtil: Partial<jest.Mocked<JwtUtil>>;
  let mockPasswordUtil: jest.Mocked<PasswordUtil>;

  beforeEach(() => {
    mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    mockTokensRepository = {
      create: jest.fn(),
      findByRefreshToken: jest.fn(),
      revokeToken: jest.fn(),
      cleanExpiredTokens: jest.fn(),
    };
    mockJwtUtil = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    mockPasswordUtil = {
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
      validatePasswordStrength: jest.fn(),
    } as jest.Mocked<PasswordUtil>;

    // Always provide a default mock for password strength
    mockPasswordUtil.validatePasswordStrength.mockReturnValue({ isValid: true, errors: [] });

    authService = new AuthService(
      mockUserRepository,
      mockTokensRepository,
      mockJwtUtil as unknown as JwtUtil,
      mockPasswordUtil
    );
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registrationDTO = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };
      const createdUser: User = {
        id: '1',
        email: registrationDTO.email,
        password: 'hashedPassword',
        firstName: registrationDTO.firstName,
        lastName: registrationDTO.lastName,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null,
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordUtil.hashPassword.mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockResolvedValue(createdUser);

      const result = await authService.register(registrationDTO);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(registrationDTO.email);
      expect(mockPasswordUtil.validatePasswordStrength).toHaveBeenCalledWith(registrationDTO.password);
      expect(mockPasswordUtil.hashPassword).toHaveBeenCalledWith(registrationDTO.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: registrationDTO.email,
        password: 'hashedPassword',
        firstName: registrationDTO.firstName,
        lastName: registrationDTO.lastName,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).toEqual(expect.objectContaining({
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        isActive: createdUser.isActive,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
        lastLoginAt: createdUser.lastLoginAt,
      }));
    });

    it('should throw ConflictError if user with email already exists', async () => {
      const registrationDTO = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };
      const existingUser: User = {
        id: '1',
        email: registrationDTO.email,
        password: 'hashedPassword',
        firstName: registrationDTO.firstName,
        lastName: registrationDTO.lastName,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(authService.register(registrationDTO)).rejects.toThrow(ConflictError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(registrationDTO.email);
      expect(mockPasswordUtil.validatePasswordStrength).not.toHaveBeenCalled();
      expect(mockPasswordUtil.hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing required fields', async () => {
      const invalidDTO = { email: 'test@test.com', password: 'Password123!', firstName: 'Test' }; // Missing lastName
      await expect(authService.register(invalidDTO as any)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid email format', async () => {
      const registrationDTO = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };
      await expect(authService.register(registrationDTO)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for weak password', async () => {
      const registrationDTO = {
        email: 'test@example.com',
        password: 'short',
        firstName: 'Test',
        lastName: 'User'
      };
      mockPasswordUtil.validatePasswordStrength.mockReturnValue({ isValid: false, errors: ['Password is too short'] });
      await expect(authService.register(registrationDTO)).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
    };
    const rawPassword = 'Password123!';

    it('should successfully log in a user and return tokens', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPasswordUtil.comparePassword.mockResolvedValue(true);
      (mockJwtUtil.generateAccessToken as jest.Mock).mockReturnValue('accessToken');
      (mockJwtUtil.generateRefreshToken as jest.Mock).mockReturnValue('refreshToken');
      mockTokensRepository.create.mockResolvedValue(undefined);

      const result = await authService.login(user.email, rawPassword);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(user.email);
      expect(mockPasswordUtil.comparePassword).toHaveBeenCalledWith(rawPassword, user.password);
      expect(mockJwtUtil.generateAccessToken).toHaveBeenCalledWith({ userId: user.id });
      expect(mockJwtUtil.generateRefreshToken).toHaveBeenCalledWith({ userId: user.id });
      expect(mockTokensRepository.create).toHaveBeenCalledWith(user.id, 'refreshToken', expect.any(Date));
      expect(result).toEqual(expect.objectContaining({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      }));
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toEqual(expect.objectContaining({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }));
    });

    it('should throw ValidationError if user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      await expect(authService.login(user.email, rawPassword)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if password is incorrect', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockPasswordUtil.comparePassword.mockResolvedValue(false);
      await expect(authService.login(user.email, rawPassword)).rejects.toThrow(ValidationError);
    });
  });

  describe('refresh', () => {
    const userId = '1';
    const oldRefreshToken = 'oldRefreshToken';
    const newAccessToken = 'newAccessToken';
    const newRefreshToken = 'newRefreshToken';

    it('should successfully refresh tokens', async () => {
      (mockJwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue({ userId });
      mockTokensRepository.findByRefreshToken.mockResolvedValue({ userId, refreshToken: oldRefreshToken, expiresIn: new Date() });
      mockTokensRepository.revokeToken.mockResolvedValue(undefined);
      (mockJwtUtil.generateAccessToken as jest.Mock).mockReturnValue(newAccessToken);
      (mockJwtUtil.generateRefreshToken as jest.Mock).mockReturnValue(newRefreshToken);
      mockTokensRepository.create.mockResolvedValue(undefined);

      const result = await authService.refresh(oldRefreshToken);

      expect(mockJwtUtil.verifyRefreshToken).toHaveBeenCalledWith(oldRefreshToken);
      expect(mockTokensRepository.findByRefreshToken).toHaveBeenCalledWith(oldRefreshToken);
      expect(mockTokensRepository.revokeToken).toHaveBeenCalledWith(oldRefreshToken);
      expect(mockJwtUtil.generateAccessToken).toHaveBeenCalledWith({ userId });
      expect(mockJwtUtil.generateRefreshToken).toHaveBeenCalledWith({ userId });
      expect(mockTokensRepository.create).toHaveBeenCalledWith(userId, newRefreshToken, expect.any(Date));
      expect(result).toEqual({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    });

    it('should throw ValidationError if refresh token is invalid', async () => {
      (mockJwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue(null);
      await expect(authService.refresh(oldRefreshToken)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if refresh token is not found or revoked', async () => {
      (mockJwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue({ userId });
      mockTokensRepository.findByRefreshToken.mockResolvedValue(null);
      await expect(authService.refresh(oldRefreshToken)).rejects.toThrow(ValidationError);
    });
  });

  describe('logout', () => {
    const refreshToken = 'someRefreshToken';

    it('should successfully revoke a refresh token', async () => {
      mockTokensRepository.revokeToken.mockResolvedValue(undefined);

      await authService.logout(refreshToken);

      expect(mockTokensRepository.revokeToken).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe('getUserProfile', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
    };

    it('should return user profile without password', async () => {
      mockUserRepository.findById.mockResolvedValue(user);

      const result = await authService.getUserProfile(user.id);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(expect.objectContaining({ id: user.id, email: user.email }));
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ValidationError if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      await expect(authService.getUserProfile(user.id)).rejects.toThrow(ValidationError);
    });
  });

  describe('updateUserProfile', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
    };

    it('should successfully update user profile without password change', async () => {
      const updates: Partial<User> = { firstName: 'New', lastName: 'User' };
      const updatedUser = { ...user, ...updates };
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await authService.updateUserProfile(user.id, updates);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(user.id);
      expect(mockUserRepository.update).toHaveBeenCalledWith(user.id, updates);
      expect(result).toEqual(expect.objectContaining({ firstName: 'New', lastName: 'User' }));
      expect(result).not.toHaveProperty('password');
    });

    it('should successfully update user profile with password change', async () => {
      const updates: Partial<User> = { password: 'NewPassword123!' };
      const updatedUser = { ...user, password: 'newHashedPassword' };
      mockUserRepository.findById.mockResolvedValue(user);
      mockPasswordUtil.validatePasswordStrength.mockReturnValue({ isValid: true, errors: [] });
      mockPasswordUtil.hashPassword.mockResolvedValue('newHashedPassword');
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await authService.updateUserProfile(user.id, updates);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(user.id);
      expect(mockPasswordUtil.validatePasswordStrength).toHaveBeenCalledWith(updates.password);
      expect(mockPasswordUtil.hashPassword).toHaveBeenCalledWith(updates.password);
      expect(mockUserRepository.update).toHaveBeenCalledWith(user.id, { password: 'newHashedPassword' });
      expect(result).toEqual(expect.objectContaining({ id: user.id }));
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ValidationError if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      await expect(authService.updateUserProfile(user.id, { firstName: 'newname' })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for attempting to update email', async () => {
      const updates = { email: 'new@example.com' };
      await expect(authService.updateUserProfile(user.id, updates)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for weak new password', async () => {
      const updates = { password: 'weak' };
      mockUserRepository.findById.mockResolvedValue(user);
      mockPasswordUtil.validatePasswordStrength.mockReturnValue({ isValid: false, errors: ['Password is too short'] });
      await expect(authService.updateUserProfile(user.id, updates)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid isActive type', async () => {
      const updates = { isActive: 'true' } as any; // Intentionally invalid type
      mockUserRepository.findById.mockResolvedValue(user);
      await expect(authService.updateUserProfile(user.id, updates)).rejects.toThrow(ValidationError);
    });
  });
});
