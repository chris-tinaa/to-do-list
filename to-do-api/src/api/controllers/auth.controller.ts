/**
 * Authentication API Controller
 * @fileoverview REST API endpoints for user authentication and account management
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AuthService, LoginInput, RegisterInput, UpdateProfileInput } from '../../services/auth.service';

/**
 * Controller class for handling authentication API endpoints
 * Handles HTTP requests and responses for auth operations
 */
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Register a new user account
   * @param req - Express request object with registration data
   * @param res - Express response object
   * @param next - Express next function
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email, password, firstName, and lastName are required'
          }
        });
        return;
      }

      const registerInput: RegisterInput = {
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      };

      const result = await this.authService.register(registerInput);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          tokenType: 'Bearer',
          expiresIn: '15m'
        },
        message: 'User registered successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Login user with email and password
   * @param req - Express request object with login credentials
   * @param res - Express response object
   * @param next - Express next function
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required'
          }
        });
        return;
      }

      const loginInput: LoginInput = {
        email: email.trim(),
        password
      };

      const result = await this.authService.login(loginInput);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          tokenType: 'Bearer',
          expiresIn: '15m',
          loginTime: '2025-07-05T15:06:50.000Z'
        },
        message: 'Login successful'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   * @param req - Express request object with refresh token
   * @param res - Express response object
   * @param next - Express next function
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required'
          }
        });
        return;
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          tokenType: 'Bearer',
          expiresIn: '15m',
          refreshedAt: '2025-07-05T15:06:50.000Z'
        },
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user and invalidate refresh token
   * @param req - Express request object with refresh token
   * @param res - Express response object
   * @param next - Express next function
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required'
          }
        });
        return;
      }

      await this.authService.logout(refreshToken);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/profile
   * Get current user profile
   * @param req - Express request object with user authentication
   * @param res - Express response object
   * @param next - Express next function
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const user = await this.authService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/profile
   * Update user profile
   * @param req - Express request object with user authentication and update data
   * @param res - Express response object
   * @param next - Express next function
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const { firstName, lastName, password, isActive } = req.body;

      // Validate that at least one field is provided
      if (firstName === undefined && lastName === undefined && password === undefined && isActive === undefined) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one field (firstName, lastName, password, isActive) must be provided'
          }
        });
        return;
      }

      const updateInput: UpdateProfileInput = {};
      
      if (firstName !== undefined) {
        updateInput.firstName = firstName;
      }
      
      if (lastName !== undefined) {
        updateInput.lastName = lastName;
      }
      
      if (password !== undefined) {
        updateInput.password = password;
      }
      
      if (isActive !== undefined) {
        updateInput.isActive = isActive;
      }

      const updatedUser = await this.authService.updateProfile(userId, updateInput);

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/verify
   * Verify current user authentication status
   * @param req - Express request object with user authentication
   * @param res - Express response object
   * @param next - Express next function
   */
  async verifyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthRequest).userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      const user = await this.authService.verifyUser(userId);

      res.status(200).json({
        success: true,
        data: {
          user,
          isAuthenticated: true,
          verifiedAt: '2025-07-05T15:06:50.000Z'
        },
        message: 'Authentication verified'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/statistics
   * Get authentication statistics (for debugging/admin)
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statistics = await this.authService.getUserStatistics();

      res.status(200).json({
        success: true,
        data: {
          ...statistics,
          timestamp: '2025-07-05T15:06:50.000Z',
          requestedBy: 'chris-tinaa'
        },
        message: 'Authentication statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Factory function to create auth controller with dependencies
 * @param authService - Auth service instance
 * @returns Configured auth controller
 */
export function createAuthController(authService: AuthService): AuthController {
  return new AuthController(authService);
}