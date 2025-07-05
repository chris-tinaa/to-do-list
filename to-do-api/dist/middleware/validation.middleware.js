"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskSchemas = exports.listSchemas = exports.authSchemas = exports.validate = void 0;
exports.validateRequest = validateRequest;
const joi_1 = __importDefault(require("joi"));
const errors_1 = require("../utils/errors");
/**
 * Factory function to create a validation middleware.
 * @param schema Joi schema to validate the request body against.
 * @returns Express middleware function.
 */
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        next(new errors_1.ValidationError(errors.join(', ')));
    }
    else {
        next();
    }
};
exports.validate = validate;
/**
 * Basic request validation middleware
 * Validates that request body is valid JSON and not empty when required
 */
function validateRequest(req, res, next) {
    try {
        // For POST and PUT requests, ensure body exists and is not empty
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            if (!req.body || Object.keys(req.body).length === 0) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Request body is required'
                    }
                });
                return;
            }
        }
        next();
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request format'
            }
        });
    }
}
/**
 * Validation schemas for authentication related requests.
 */
exports.authSchemas = {
    register: joi_1.default.object({
        email: joi_1.default.string().email().required().messages({
            'string.email': 'Email must be a valid email address',
            'string.empty': 'Email cannot be empty',
            'any.required': 'Email is required',
        }),
        password: joi_1.default.string().min(8).required().messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.empty': 'Password cannot be empty',
            'any.required': 'Password is required',
        }),
        firstName: joi_1.default.string().required().messages({
            'string.empty': 'First name cannot be empty',
            'any.required': 'First name is required',
        }),
        lastName: joi_1.default.string().required().messages({
            'string.empty': 'Last name cannot be empty',
            'any.required': 'Last name is required',
        }),
    }),
    login: joi_1.default.object({
        email: joi_1.default.string().email().required().messages({
            'string.email': 'Email must be a valid email address',
            'string.empty': 'Email cannot be empty',
            'any.required': 'Email is required',
        }),
        password: joi_1.default.string().required().messages({
            'string.empty': 'Password cannot be empty',
            'any.required': 'Password is required',
        }),
    }),
    refresh: joi_1.default.object({
        refreshToken: joi_1.default.string().required().messages({
            'string.empty': 'Refresh token cannot be empty',
            'any.required': 'Refresh token is required',
        }),
    }),
    logout: joi_1.default.object({
        refreshToken: joi_1.default.string().required().messages({
            'string.empty': 'Refresh token cannot be empty',
            'any.required': 'Refresh token is required',
        }),
    }),
    updateProfile: joi_1.default.object({
        firstName: joi_1.default.string().optional(),
        lastName: joi_1.default.string().optional(),
        password: joi_1.default.string().min(8).optional().messages({
            'string.min': 'Password must be at least 8 characters long',
        }),
        isActive: joi_1.default.boolean().optional(),
    }).min(1).messages({
        'object.min': 'At least one field (firstName, lastName, password, isActive) is required for update.',
    }),
};
/**
 * Validation schemas for lists related requests.
 */
exports.listSchemas = {
    create: joi_1.default.object({
        name: joi_1.default.string().max(100).required().messages({
            'string.empty': 'List name cannot be empty',
            'string.max': 'List name cannot exceed 100 characters',
            'any.required': 'List name is required',
        }),
        description: joi_1.default.string().max(500).optional().allow('').messages({
            'string.max': 'List description cannot exceed 500 characters',
        }),
    }),
    update: joi_1.default.object({
        name: joi_1.default.string().max(100).optional().messages({
            'string.empty': 'List name cannot be empty',
            'string.max': 'List name cannot exceed 100 characters',
        }),
        description: joi_1.default.string().max(500).optional().allow('').messages({
            'string.max': 'List description cannot exceed 500 characters',
        }),
    }).min(1).messages({
        'object.min': 'At least one field (name or description) is required for update.',
    }),
};
/**
 * Validation schemas for tasks related requests.
 */
exports.taskSchemas = {
    create: joi_1.default.object({
        title: joi_1.default.string().max(200).required().messages({
            'string.empty': 'Task title cannot be empty',
            'string.max': 'Task title cannot exceed 200 characters',
            'any.required': 'Task title is required',
        }),
        description: joi_1.default.string().max(1000).optional().allow('').messages({
            'string.max': 'Task description cannot exceed 1000 characters',
        }),
        deadline: joi_1.default.string().isoDate().optional().messages({
            'string.isoDate': 'Deadline must be a valid ISO 8601 date format',
        }),
        priority: joi_1.default.string().valid('low', 'medium', 'high').optional().messages({
            'any.only': 'Priority must be one of: low, medium, high',
        }),
    }),
    update: joi_1.default.object({
        title: joi_1.default.string().max(200).optional().messages({
            'string.empty': 'Task title cannot be empty',
            'string.max': 'Task title cannot exceed 200 characters',
        }),
        description: joi_1.default.string().max(1000).optional().allow('').messages({
            'string.max': 'Task description cannot exceed 1000 characters',
        }),
        deadline: joi_1.default.string().isoDate().optional().allow(null).messages({
            'string.isoDate': 'Deadline must be a valid ISO 8601 date format',
        }),
        priority: joi_1.default.string().valid('low', 'medium', 'high').optional().allow(null).messages({
            'any.only': 'Priority must be one of: low, medium, high',
        }),
        isCompleted: joi_1.default.boolean().optional().messages({
            'boolean.base': 'isCompleted must be a boolean value',
        }),
    }).min(1).messages({
        'object.min': 'At least one field (title, description, deadline, priority, isCompleted) is required for update.',
    }),
};
