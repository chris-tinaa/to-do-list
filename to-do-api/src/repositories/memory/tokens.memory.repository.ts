import { ITokensRepository } from '../interfaces/tokens.repository.interface';

interface InMemoryToken {
  userId: string;
  refreshToken: string;
  expiresIn: Date;
}

export class TokensMemoryRepository implements ITokensRepository {
  private tokens: InMemoryToken[] = [];

  async create(userId: string, refreshToken: string, expiresIn: Date): Promise<void> {
    this.tokens.push({ userId, refreshToken, expiresIn });
  }

  async findByRefreshToken(refreshToken: string): Promise<{ userId: string; refreshToken: string; expiresIn: Date } | null> {
    const token = this.tokens.find(token => token.refreshToken === refreshToken && token.expiresIn > new Date());
    return token || null;
  }

  async revokeToken(refreshToken: string): Promise<void> {
    this.tokens = this.tokens.filter(token => token.refreshToken !== refreshToken);
  }

  async cleanExpiredTokens(): Promise<void> {
    this.tokens = this.tokens.filter(token => token.expiresIn > new Date());
  }
} 