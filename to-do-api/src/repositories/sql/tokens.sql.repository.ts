import { ITokensRepository } from '../interfaces/tokens.repository.interface';
import { Pool } from 'pg';

export class TokensSQLRepository implements ITokensRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(userId: string, refreshToken: string, expiresIn: Date): Promise<void> {
    const query = `
      INSERT INTO tokens (user_id, refresh_token, expires_at)
      VALUES ($1, $2, $3);
    `;
    const values = [userId, refreshToken, expiresIn.toISOString()];
    await this.pool.query(query, values);
  }

  async findByRefreshToken(refreshToken: string): Promise<{ userId: string; refreshToken: string; expiresIn: Date } | null> {
    const query = `
      SELECT user_id, refresh_token, expires_at
      FROM tokens
      WHERE refresh_token = $1 AND expires_at > NOW();
    `;
    const result = await this.pool.query(query, [refreshToken]);
    const foundToken = result.rows[0];
    if (!foundToken) return null;
    return {
      userId: foundToken.user_id,
      refreshToken: foundToken.refresh_token,
      expiresIn: new Date(foundToken.expires_at),
    };
  }

  async revokeToken(refreshToken: string): Promise<void> {
    const query = `
      DELETE FROM tokens
      WHERE refresh_token = $1;
    `;
    await this.pool.query(query, [refreshToken]);
  }

  async cleanExpiredTokens(): Promise<void> {
    const query = `
      DELETE FROM tokens
      WHERE expires_at <= NOW();
    `;
    await this.pool.query(query);
  }
} 