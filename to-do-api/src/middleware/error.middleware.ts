/**
 * Error Handling Middleware
 * @fileoverview Centralized error handling for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

// Assuming you have these error types, otherwise we'll use a generic approach
interface CustomError extends Error {
  statusCode?: number;
  errorCode?: string;
}

interface NotFoundError extends Error {
  name: 'NotFoundError';
}

/**
 * Global error handling middleware
 * Processes all errors and returns consistent API responses
 */
export function errorMiddleware(error: any, req: Request, res: Response, next: NextFunction): void {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: '2025-07-05 14:57:14',
    user: 'chris-tinaa'
  });

  // Handle ValidationError from your existing utils
  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
    return;
  }

  // Handle NotFoundError
  if (error.name === 'NotFoundError') {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message
      }
    });
    return;
  }

  // Handle custom errors with statusCode
  if (error.statusCode) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.errorCode || 'CUSTOM_ERROR',
        message: error.message
      }
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token expired'
      }
    });
    return;
  }

  // Handle generic errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message
    }
  });
}