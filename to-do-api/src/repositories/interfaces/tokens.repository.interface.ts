/**
 * TokenRepository interface
 * Defines contract for token data access
 */
import { Token } from '../../models/token.model';

export interface ITokensRepository {
  create(userId: string, refreshToken: string, expiresIn: Date): Promise<void>;
  findByRefreshToken(refreshToken: string): Promise<{ userId: string; refreshToken: string; expiresIn: Date } | null>;
  revokeToken(refreshToken: string): Promise<void>;
  cleanExpiredTokens(): Promise<void>;
} 