/**
 * JWT Configuration
 * @fileoverview JWT token configuration and settings
 */

export interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

/**
 * Get JWT configuration from environment variables
 * @returns JWT configuration object
 */
export function getJwtConfig(): JwtConfig {
  const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
  const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;

  if (!accessTokenSecret || !refreshTokenSecret) {
    // Provide default secrets for development/testing
    console.warn('JWT secrets not found in environment, using default values for development');
    
    return {
      accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET || 'default-access-secret-key-for-development-only-change-in-production',
      refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET || 'default-refresh-secret-key-for-development-only-change-in-production',
      accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
      refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d'
    };
  }

  return {
    accessTokenSecret,
    refreshTokenSecret,
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d'
  };
}