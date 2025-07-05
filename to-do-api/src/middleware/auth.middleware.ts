import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtConfig } from '../config/jwt.config';

export interface AuthRequest extends Request {
  userId?: string;
}

// Properly typed middleware function
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: 'Authorization header missing' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Token missing' });
      return;
    }

    const jwtConfig = getJwtConfig();
    const decoded = jwt.verify(token, jwtConfig.accessTokenSecret) as { userId: string };
    
    // Extend the request object with userId
    (req as AuthRequest).userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const jwtConfig = getJwtConfig();
        const decoded = jwt.verify(token, jwtConfig.accessTokenSecret) as { userId: string };
        (req as AuthRequest).userId = decoded.userId;
      } catch (error) {
        // Log error but do not prevent request from proceeding
        console.warn('Optional authentication token invalid or expired:', error);
      }
    }
  }
  next();
};