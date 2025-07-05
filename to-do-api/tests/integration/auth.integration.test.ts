import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import { AuthController } from '../../src/api/controllers/auth.controller';
import { AuthService } from '../../src/services/auth.service';
import type { UserRepository } from '../../src/repositories/interfaces/user.repository.interface';
import { getUserRepository } from '../../src/repositories';
import type { ITokensRepository } from '../../src/repositories/interfaces/tokens.repository.interface';
import { getTokensRepository } from '../../src/repositories';
import { JwtUtil } from '../../src/utils/jwt.util';
import { PasswordUtil } from '../../src/utils/password.util';
import { validate, authSchemas } from '../../src/middleware/validation.middleware';
import { authRateLimiter, loginRateLimiter } from '../../src/middleware/rate-limit.middleware';
import { errorHandler } from '../../src/middleware/error.middleware';

process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';

describe('Auth Integration Tests', () => {
  let app: Express;
  let authService: AuthService;
  let authController: AuthController;
  let userRepository: UserRepository;
  let tokensRepository: ITokensRepository;
  let jwtUtil: JwtUtil;
  let passwordUtil: PasswordUtil;

  beforeAll(() => {
    userRepository = getUserRepository();
    tokensRepository = getTokensRepository();
    jwtUtil = new JwtUtil();
    passwordUtil = new PasswordUtil();
    authService = new AuthService(userRepository, tokensRepository, jwtUtil, passwordUtil);
    authController = new AuthController(authService);

    app = express();
    app.use(express.json());

    // Manually register auth routes with middleware, similar to how it would be in app.ts
    app.post('/api/auth/register', authRateLimiter, validate(authSchemas.register), authController.register.bind(authController));
    app.post('/api/auth/login', loginRateLimiter, validate(authSchemas.login), authController.login.bind(authController));
    app.post('/api/auth/refresh', authRateLimiter, validate(authSchemas.refresh), authController.refresh.bind(authController));
    app.post('/api/auth/logout', authController.logout.bind(authController)); // authMiddleware will be added later
    app.get('/api/auth/me', authController.getMyProfile.bind(authController)); // authMiddleware will be added later
    app.put('/api/auth/me', validate(authSchemas.updateProfile), authController.updateMyProfile.bind(authController)); // authMiddleware will be added later

    app.use(errorHandler as express.ErrorRequestHandler);
  });

  afterEach(() => {
    // Clean up mocks or reset data if using in-memory repositories
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockImplementation((userToCreate) => Promise.resolve({
        id: 'test-user-id',
        email: userToCreate.email,
        password: userToCreate.password,
        firstName: userToCreate.firstName,
        lastName: userToCreate.lastName,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null,
      }));
      jest.spyOn(passwordUtil, 'hashPassword').mockResolvedValue('hashedPassword123');
      jest.spyOn(passwordUtil, 'validatePasswordStrength').mockReturnValue({ isValid: true, errors: [] });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'SecurePassword123',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe('john.doe@example.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 409 if email is already registered', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue({
        id: 'existing-user-id',
        email: 'john.doe@example.com',
        firstName: 'Existing',
        lastName: 'User',
        password: 'existingHashedPassword',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'AnotherSecurePassword123',
        });

      expect(response.statusCode).toBe(409); // Conflict
      expect(response.body.message).toBe('User with that email already exists.');
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          // Missing lastName, email, password
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('Last name is required');
      expect(response.body.message).toContain('Email is required');
      expect(response.body.message).toContain('Password is required');
    });
  });

  describe('POST /api/auth/login', () => {
    const mockUser = {
      id: 'user123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'hashedPassword',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    const rawPassword = 'Password123';
    const accessToken = 'mockAccessToken';
    const refreshToken = 'mockRefreshToken';

    beforeEach(() => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(passwordUtil, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(jwtUtil, 'generateAccessToken').mockReturnValue(accessToken);
      jest.spyOn(jwtUtil, 'generateRefreshToken').mockReturnValue(refreshToken);
      jest.spyOn(tokensRepository, 'create').mockResolvedValue(undefined);
    });

    it('should successfully log in a user and return tokens', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: rawPassword,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('User logged in successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(mockUser.email);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid credentials (user not found)', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: rawPassword,
        });

      expect(response.statusCode).toBe(400); // Bad Request (ValidationError)
      expect(response.body.message).toBe('Invalid credentials.');
    });

    it('should return 400 for invalid credentials (incorrect password)', async () => {
      jest.spyOn(passwordUtil, 'comparePassword').mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'WrongPassword',
        });

      expect(response.statusCode).toBe(400); // Bad Request (ValidationError)
      expect(response.body.message).toBe('Invalid credentials.');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          // Missing password
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('Password is required');
    });
  });
}); 