import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../../src/middleware/auth.middleware';

// Mock the getJwtConfig to provide consistent test environment
jest.mock('../../src/config/jwt.config', () => ({
  getJwtConfig: () => ({
    accessTokenSecret: 'testAccessTokenSecret',
    refreshTokenSecret: 'testRefreshTokenSecret',
    accessTokenExpiresIn: '1h',
    refreshTokenExpiresIn: '7d',
  }),
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = { headers: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('authMiddleware', () => {
    it('should call next() if a valid token is provided', () => {
      const token = jwt.sign({ userId: '123' }, 'testAccessTokenSecret', { expiresIn: '1h' });
      mockRequest.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.userId).toBe('123');
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header is missing', () => {
      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authorization header missing' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is missing from header', () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Token missing' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for an invalid token', () => {
      mockRequest.headers = { authorization: 'Bearer invalidtoken' };

      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for an expired token', () => {
      const expiredToken = jwt.sign({ userId: '123' }, 'testAccessTokenSecret', { expiresIn: '0s' });
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` };

      // Wait for the token to expire
      return new Promise(resolve => setTimeout(() => {
        authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Token expired' });
        expect(mockNext).not.toHaveBeenCalled();
        resolve(null);
      }, 1000));
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should call next() if a valid token is provided and set userId', () => {
      const token = jwt.sign({ userId: '123' }, 'testAccessTokenSecret', { expiresIn: '1h' });
      mockRequest.headers = { authorization: `Bearer ${token}` };

      optionalAuthMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.userId).toBe('123');
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should call next() if no token is provided', () => {
      optionalAuthMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should call next() even if token is invalid, but not set userId', () => {
      mockRequest.headers = { authorization: 'Bearer invalidtoken' };

      optionalAuthMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockRequest.userId).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should call next() even if token is expired, but not set userId', () => {
      const expiredToken = jwt.sign({ userId: '123' }, 'testAccessTokenSecret', { expiresIn: '0s' });
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` };

      // Wait for the token to expire
      return new Promise(resolve => setTimeout(() => {
        optionalAuthMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);
        expect(mockRequest.userId).toBeUndefined();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
        resolve(null);
      }, 1000));
    });
  });
}); 