"use strict";
/**
 * @fileoverview Utility functions for JSON Web Token (JWT) management.
 * This includes generating and verifying access and refresh tokens.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtUtil = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../config/jwt.config");
/**
 * `JwtUtil` provides methods for JWT operations.
 * It handles the generation and verification of both access and refresh tokens
 * using the configured secrets and expiration times.
 */
class JwtUtil {
    constructor() {
        this.jwtConfig = (0, jwt_config_1.getJwtConfig)();
    }
    /**
     * Generates a new access token for a given payload.
     * The token is signed using the `accessTokenSecret` and expires after `accessTokenExpiresIn`.
     * @param payload The data to be encoded in the token (e.g., user ID, email).
     * @returns A signed JWT access token string.
     */
    generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.jwtConfig.accessTokenSecret, { expiresIn: this.jwtConfig.accessTokenExpiresIn });
    }
    /**
     * Generates a new refresh token for a given payload.
     * The token is signed using the `refreshTokenSecret` and expires after `refreshTokenExpiresIn`.
     * @param payload The data to be encoded in the token.
     * @returns A signed JWT refresh token string.
     */
    generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.jwtConfig.refreshTokenSecret, { expiresIn: this.jwtConfig.refreshTokenExpiresIn });
    }
    /**
     * Verifies an access token.
     * @param token The access token string to verify.
     * @returns The decoded token payload if verification is successful.
     * @throws {jwt.TokenExpiredError} If the token has expired.
     * @throws {jwt.JsonWebTokenError} If the token is invalid.
     */
    verifyAccessToken(token) {
        return this.verifyToken(token, 'access');
    }
    /**
     * Verifies a refresh token.
     * @param token The refresh token string to verify.
     * @returns The decoded token payload if verification is successful.
     * @throws {jwt.TokenExpiredError} If the token has expired.
     * @throws {jwt.JsonWebTokenError} If the token is invalid.
     */
    verifyRefreshToken(token) {
        return this.verifyToken(token, 'refresh');
    }
    /**
     * Verifies a given JWT token.
     * It checks the token's validity against the appropriate secret (access or refresh).
     * Throws an error if the token is invalid or expired.
     * @param token The JWT token string to verify.
     * @param type The type of token to verify ('access' or 'refresh').
     * @returns The decoded token payload if verification is successful.
     * @throws {jwt.TokenExpiredError} If the token has expired.
     * @throws {jwt.JsonWebTokenError} If the token is invalid (e.g., malformed, wrong signature).
     */
    verifyToken(token, type) {
        const secret = type === 'access' ? this.jwtConfig.accessTokenSecret : this.jwtConfig.refreshTokenSecret;
        return jsonwebtoken_1.default.verify(token, secret);
    }
}
exports.JwtUtil = JwtUtil;
