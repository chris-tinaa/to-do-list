/**
 * Authentication Routes
 * @fileoverview Express routes for authentication API endpoints
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware';
import { validate, authSchemas } from '../../middleware/validation.middleware';
import { loginRateLimiter, authRateLimiter } from '../../middleware/rate-limit.middleware';

/**
 * Create authentication routes with all middleware and validation
 * @param authController - Auth controller instance
 * @returns Configured Express router
 */
export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user account
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "chris-tinaa@example.com"
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 example: "SecurePass123!"
   *               firstName:
   *                 type: string
   *                 example: "Chris"
   *               lastName:
   *                 type: string
   *                 example: "Tinaa"
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     accessToken:
   *                       type: string
   *                     refreshToken:
   *                       type: string
   *                     tokenType:
   *                       type: string
   *                       example: "Bearer"
   *                     expiresIn:
   *                       type: string
   *                       example: "15m"
   *                 message:
   *                   type: string
   *                   example: "User registered successfully"
   *       400:
   *         description: Validation error
   *       409:
   *         description: User already exists
   */
  router.post('/register', 
    authRateLimiter, 
    validate(authSchemas.register), 
    authController.register.bind(authController)
  );

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login with email and password
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "chris-tinaa@example.com"
   *               password:
   *                 type: string
   *                 example: "SecurePass123!"
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     accessToken:
   *                       type: string
   *                     refreshToken:
   *                       type: string
   *                     tokenType:
   *                       type: string
   *                       example: "Bearer"
   *                     expiresIn:
   *                       type: string
   *                       example: "15m"
   *                     loginTime:
   *                       type: string
   *                       format: date-time
   *                 message:
   *                   type: string
   *                   example: "Login successful"
   *       401:
   *         description: Invalid credentials
   */
  router.post('/login', 
    loginRateLimiter, 
    validate(authSchemas.login), 
    authController.login.bind(authController)
  );

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       401:
   *         description: Invalid or expired refresh token
   */
  router.post('/refresh', 
    authRateLimiter, 
    validate(authSchemas.refresh), 
    authController.refreshToken.bind(authController)
  );

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout user and invalidate refresh token
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *     responses:
   *       200:
   *         description: Logout successful
   *       400:
   *         description: Refresh token required
   */
  router.post('/logout', 
    authRateLimiter, 
    optionalAuthMiddleware, 
    validate(authSchemas.logout), 
    authController.logout.bind(authController)
  );

  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     summary: Get current user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *                 message:
   *                   type: string
   *                   example: "Profile retrieved successfully"
   *       401:
   *         description: Authentication required
   */
  router.get('/profile', 
    authRateLimiter, 
    authMiddleware, 
    authController.getProfile.bind(authController)
  );

  /**
   * @swagger
   * /api/auth/profile:
   *   put:
   *     summary: Update user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *                 example: "Christopher"
   *               lastName:
   *                 type: string
   *                 example: "Tinaa-Updated"
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 example: "NewSecurePass123!"
   *               isActive:
   *                 type: boolean
   *                 example: true
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Authentication required
   */
  router.put('/profile', 
    authRateLimiter, 
    authMiddleware, 
    validate(authSchemas.updateProfile), 
    authController.updateProfile.bind(authController)
  );

  /**
   * @swagger
   * /api/auth/verify:
   *   get:
   *     summary: Verify authentication status
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Authentication verified
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     isAuthenticated:
   *                       type: boolean
   *                       example: true
   *                     verifiedAt:
   *                       type: string
   *                       format: date-time
   *                 message:
   *                   type: string
   *                   example: "Authentication verified"
   *       401:
   *         description: Authentication failed
   */
  router.get('/verify', 
    authRateLimiter, 
    authMiddleware, 
    authController.verifyAuth.bind(authController)
  );

  /**
   * @swagger
   * /api/auth/statistics:
   *   get:
   *     summary: Get authentication statistics
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalUsers:
   *                       type: integer
   *                       example: 5
   *                     activeUsers:
   *                       type: integer
   *                       example: 4
   *                     inactiveUsers:
   *                       type: integer
   *                       example: 1
   *                     activeRefreshTokens:
   *                       type: integer
   *                       example: 3
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                     requestedBy:
   *                       type: string
   *                       example: "chris-tinaa"
   *                 message:
   *                   type: string
   *                   example: "Authentication statistics retrieved successfully"
   */
  router.get('/statistics', 
    authRateLimiter, 
    authController.getStatistics.bind(authController)
  );

  return router;
}

// For backward compatibility with your existing index.ts
const authController = require('../controllers/auth.controller');
const router = Router();

// Apply rate limiting and validation middleware to all routes
router.use(authRateLimiter);

// Public routes (no authentication required)
router.post('/register', validate(authSchemas.register), authController.register);
router.post('/login', loginRateLimiter, validate(authSchemas.login), authController.login);
router.post('/refresh', validate(authSchemas.refresh), authController.refreshToken);
router.post('/logout', optionalAuthMiddleware, validate(authSchemas.logout), authController.logout);
router.get('/statistics', authController.getStatistics);

// Protected routes (authentication required)
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validate(authSchemas.updateProfile), authController.updateProfile);
router.get('/verify', authMiddleware, authController.verifyAuth);

export default router;