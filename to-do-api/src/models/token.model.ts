/**
 * Token model interface
 * @see docs/prd.md section 5.4
 */
export interface Token {
  id: string; // UUID
  userId: string; // UUID
  accessToken: string; // JWT
  refreshToken: string; // UUID
  accessTokenExpiresAt: string; // ISO 8601
  refreshTokenExpiresAt: string; // ISO 8601
  isRevoked: boolean;
  createdAt: string; // ISO 8601
  revokedAt?: string | null; // ISO 8601 or null
} 