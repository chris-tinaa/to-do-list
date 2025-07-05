"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message, statusCode = 400, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.CustomError = CustomError;
class NotFoundError extends CustomError {
    constructor(message) {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends CustomError {
    constructor(message) {
        super(message, 409, 'CONFLICT');
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends CustomError {
    constructor(message) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
