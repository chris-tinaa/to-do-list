"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_service_1 = require("../../services/auth.service");
const user_repository_interface_1 = require("../../repositories/user.repository.interface");
const tokens_repository_interface_1 = require("../../repositories/tokens.repository.interface");
const jwt_util_1 = require("../../utils/jwt.util");
const password_util_1 = require("../../utils/password.util");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
const authRouter = (0, express_1.Router)();
// Instantiate dependencies
const userRepository = user_repository_interface_1.UserRepositoryFactory.create();
const tokensRepository = tokens_repository_interface_1.TokensRepositoryFactory.create();
const jwtUtil = new jwt_util_1.JwtUtil();
const passwordUtil = new password_util_1.PasswordUtil();
// Instantiate AuthService and AuthController
const authService = new auth_service_1.AuthService(userRepository, tokensRepository, jwtUtil, passwordUtil);
const authController = new auth_controller_1.AuthController(authService);
// Public routes
authRouter.post('/register', rate_limit_middleware_1.authRateLimiter, (0, validation_middleware_1.validate)(validation_middleware_1.authSchemas.register), authController.register.bind(authController));
authRouter.post('/login', rate_limit_middleware_1.loginRateLimiter, (0, validation_middleware_1.validate)(validation_middleware_1.authSchemas.login), authController.login.bind(authController));
authRouter.post('/refresh', rate_limit_middleware_1.authRateLimiter, (0, validation_middleware_1.validate)(validation_middleware_1.authSchemas.refresh), authController.refresh.bind(authController));
// Protected routes
authRouter.post('/logout', auth_middleware_1.authMiddleware, (0, validation_middleware_1.validate)(validation_middleware_1.authSchemas.logout), authController.logout.bind(authController));
authRouter.get('/me', auth_middleware_1.authMiddleware, authController.getMyProfile.bind(authController));
authRouter.put('/me', auth_middleware_1.authMiddleware, (0, validation_middleware_1.validate)(validation_middleware_1.authSchemas.updateProfile), authController.updateMyProfile.bind(authController));
exports.default = authRouter;
