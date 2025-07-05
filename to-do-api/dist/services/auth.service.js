"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const errors_1 = require("../utils/errors");
class AuthService {
    constructor(userRepository, tokensRepository, jwtUtil, passwordUtil) {
        this.userRepository = userRepository;
        this.tokensRepository = tokensRepository;
        this.jwtUtil = jwtUtil;
        this.passwordUtil = passwordUtil;
    }
    /**
     * Registers a new user.
     */
    async register(user) {
        // Basic input validation
        if (!user.email || !user.password || !user.firstName || !user.lastName) {
            throw new errors_1.ValidationError('Email, password, first name, and last name are required for registration.');
        }
        // Email format validation (simple regex)
        const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!emailRegex.test(user.email)) {
            throw new errors_1.ValidationError('Invalid email format.');
        }
        // Check if user with given email already exists
        const existingUser = await this.userRepository.findByEmail(user.email);
        if (existingUser) {
            throw new errors_1.ConflictError('User with that email already exists.');
        }
        // Password strength validation (should ONLY be called if user doesn't exist!)
        const passwordStrength = this.passwordUtil.validatePasswordStrength(user.password);
        if (!passwordStrength.isValid) {
            throw new errors_1.ValidationError(passwordStrength.errors.join(' '));
        }
        // Hash password before saving
        const hashedPassword = await this.passwordUtil.hashPassword(user.password);
        const createdUser = await this.userRepository.create({
            email: user.email,
            password: hashedPassword,
            firstName: user.firstName,
            lastName: user.lastName,
        });
        // Remove password from response
        const { password, ...userWithoutPassword } = createdUser;
        return userWithoutPassword;
    }
    /**
     * Logs in a user and generates tokens.
     */
    async login(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new errors_1.ValidationError('Invalid credentials.');
        }
        const isPasswordValid = await this.passwordUtil.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new errors_1.ValidationError('Invalid credentials.');
        }
        const accessToken = this.jwtUtil.generateAccessToken({ userId: user.id });
        const refreshToken = this.jwtUtil.generateRefreshToken({ userId: user.id });
        await this.tokensRepository.create(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days
        const { password: _pwd, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, accessToken, refreshToken };
    }
    /**
     * Refreshes tokens.
     */
    async refresh(refreshToken) {
        const decoded = this.jwtUtil.verifyRefreshToken(refreshToken);
        if (!decoded?.userId) {
            throw new errors_1.ValidationError('Invalid refresh token.');
        }
        const storedToken = await this.tokensRepository.findByRefreshToken(refreshToken);
        if (!storedToken) {
            throw new errors_1.ValidationError('Invalid or revoked refresh token.');
        }
        await this.tokensRepository.revokeToken(refreshToken);
        const newAccessToken = this.jwtUtil.generateAccessToken({ userId: decoded.userId });
        const newRefreshToken = this.jwtUtil.generateRefreshToken({ userId: decoded.userId });
        await this.tokensRepository.create(decoded.userId, newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }
    /**
     * Logs out a user by revoking their refresh token.
     */
    async logout(refreshToken) {
        await this.tokensRepository.revokeToken(refreshToken);
    }
    /**
     * Retrieves a user's profile.
     */
    async getUserProfile(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new errors_1.ValidationError('User not found.');
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    /**
     * Updates a user's profile.
     */
    async updateUserProfile(userId, updates) {
        if ('id' in updates || 'email' in updates) {
            throw new errors_1.ValidationError('User ID and email cannot be updated directly.');
        }
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new errors_1.ValidationError('User not found.');
        }
        // Make a copy so we don't mutate the original
        const updateData = { ...updates };
        if (updateData.password) {
            const passwordStrength = this.passwordUtil.validatePasswordStrength(updateData.password);
            if (!passwordStrength.isValid) {
                throw new errors_1.ValidationError(passwordStrength.errors.join(' '));
            }
            updateData.password = await this.passwordUtil.hashPassword(updateData.password);
        }
        if (typeof updateData.isActive !== 'undefined' && typeof updateData.isActive !== 'boolean') {
            throw new errors_1.ValidationError('isActive must be a boolean.');
        }
        const updatedUser = await this.userRepository.update(userId, updateData);
        if (!updatedUser) {
            throw new Error('Failed to update user profile.');
        }
        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
}
exports.AuthService = AuthService;
