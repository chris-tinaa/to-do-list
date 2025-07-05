"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../config/jwt.config");
// Properly typed middleware function
const authMiddleware = (req, res, next) => {
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
        const jwtConfig = (0, jwt_config_1.getJwtConfig)();
        const decoded = jsonwebtoken_1.default.verify(token, jwtConfig.accessTokenSecret);
        // Extend the request object with userId
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ message: 'Token expired' });
            return;
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }
        console.error('Authentication error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const jwtConfig = (0, jwt_config_1.getJwtConfig)();
                const decoded = jsonwebtoken_1.default.verify(token, jwtConfig.accessTokenSecret);
                req.userId = decoded.userId;
            }
            catch (error) {
                // Log error but do not prevent request from proceeding
                console.warn('Optional authentication token invalid or expired:', error);
            }
        }
    }
    next();
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
