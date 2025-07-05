/**
 * Custom Error Classes
 * @fileoverview Custom error types for the application
 */

export class ValidationError extends Error {
  public statusCode = 400;
  public errorCode = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  public statusCode = 401;
  public errorCode = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  public statusCode = 403;
  public errorCode = 'FORBIDDEN';

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  public statusCode = 404;
  public errorCode = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  public statusCode = 409;
  public errorCode = 'CONFLICT';

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class CustomError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}