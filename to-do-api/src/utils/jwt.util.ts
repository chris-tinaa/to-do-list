/**
 * @fileoverview Utility functions for JSON Web Token (JWT) management.
 * This includes generating and verifying access and refresh tokens.
 */

import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { JwtConfig, getJwtConfig } from '../config/jwt.config';

/**
 * `JwtUtil` provides methods for JWT operations.
 * It handles the generation and verification of both access and refresh tokens
 * using the configured secrets and expiration times.
 */
export class JwtUtil {
  private jwtConfig: JwtConfig;

  constructor() {
    this.jwtConfig = getJwtConfig();
  }

  /**
   * Generates a new access token for a given payload.
   * The token is signed using the `accessTokenSecret` and expires after `accessTokenExpiresIn`.
   * @param payload The data to be encoded in the token (e.g., user ID, email).
   * @returns A signed JWT access token string.
   */
  public generateAccessToken(payload: object): string {
    return jwt.sign(payload, this.jwtConfig.accessTokenSecret as Secret, { expiresIn: this.jwtConfig.accessTokenExpiresIn } as SignOptions);
  }

  /**
   * Generates a new refresh token for a given payload.
   * The token is signed using the `refreshTokenSecret` and expires after `refreshTokenExpiresIn`.
   * @param payload The data to be encoded in the token.
   * @returns A signed JWT refresh token string.
   */
  public generateRefreshToken(payload: object): string {
    return jwt.sign(payload, this.jwtConfig.refreshTokenSecret as Secret, { expiresIn: this.jwtConfig.refreshTokenExpiresIn } as SignOptions);
  }

  /**
   * Verifies an access token.
   * @param token The access token string to verify.
   * @returns The decoded token payload if verification is successful.
   * @throws {jwt.TokenExpiredError} If the token has expired.
   * @throws {jwt.JsonWebTokenError} If the token is invalid.
   */
  public verifyAccessToken(token: string): any {
    return this.verifyToken(token, 'access');
  }

  /**
   * Verifies a refresh token.
   * @param token The refresh token string to verify.
   * @returns The decoded token payload if verification is successful.
   * @throws {jwt.TokenExpiredError} If the token has expired.
   * @throws {jwt.JsonWebTokenError} If the token is invalid.
   */
  public verifyRefreshToken(token: string): any {
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
  private verifyToken(token: string, type: 'access' | 'refresh'): any {
    const secret = type === 'access' ? this.jwtConfig.accessTokenSecret : this.jwtConfig.refreshTokenSecret;
    return jwt.verify(token, secret as Secret);
  }
} 