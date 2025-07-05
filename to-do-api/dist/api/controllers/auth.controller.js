"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const api_response_model_1 = require("../../models/api-response.model");
const errors_1 = require("../../utils/errors");
class AuthController {
    constructor(authService) {
        this.authService = authService;
        /**
         * Handles user registration.
         * @param req - The Express request object.
         * @param res - The Express response object.
         * @param next - The Express next middleware function.
         */
        this.register = async (req, res, next) => {
            try {
                const user = await this.authService.register(req.body);
                res.status(201).json(new api_response_model_1.APIResponse(201, 'User registered successfully', user));
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Handles user login and token generation.
         * @param req - The Express request object.
         * @param res - The Express response object.
         * @param next - The Express next middleware function.
         */
        this.login = async (req, res, next) => {
            try {
                const { email, password } = req.body;
                const { user, accessToken, refreshToken } = await this.authService.login(email, password);
                res.status(200).json(new api_response_model_1.APIResponse(200, 'User logged in successfully', { user, accessToken, refreshToken }));
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Handles refreshing access tokens using a refresh token.
         * @param req - The Express request object.
         * @param res - The Express response object.
         * @param next - The Express next middleware function.
         */
        this.refresh = async (req, res, next) => {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    throw new errors_1.ValidationError('Refresh token is required.');
                }
                const { accessToken, refreshToken: refreshedToken } = await this.authService.refresh(refreshToken);
                res.status(200).json(new api_response_model_1.APIResponse(200, 'Token refreshed successfully', { accessToken, refreshToken: refreshedToken }));
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Handles user logout by revoking the refresh token.
         * @param req - The Express request object.
         * @param res - The Express response object.
         * @param next - The Express next middleware function.
         */
        this.logout = async (req, res, next) => {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    throw new errors_1.ValidationError('Refresh token is required for logout.');
                }
                await this.authService.logout(refreshToken);
                res.status(200).json(new api_response_model_1.APIResponse(200, 'Logged out successfully'));
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Retrieves the authenticated user's profile.
         * @param req - The Express request object.
         * @param res - The Express response object.
         * @param next - The Express next middleware function.
         */
        this.getMyProfile = async (req, res, next) => {
            try {
                const userId = req.user.id;
                const user = await this.authService.getUserProfile(userId);
                res.status(200).json(new api_response_model_1.APIResponse(200, 'User profile retrieved successfully', user));
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Updates the authenticated user's profile.
         * @param req - The Express request object.
         * @param res - The Express response object.
         * @param next - The Express next middleware function.
         */
        this.updateMyProfile = async (req, res, next) => {
            try {
                const userId = req.user.id;
                const updatedUser = await this.authService.updateUserProfile(userId, req.body);
                res.status(200).json(new api_response_model_1.APIResponse(200, 'User profile updated successfully', updatedUser));
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.AuthController = AuthController;
