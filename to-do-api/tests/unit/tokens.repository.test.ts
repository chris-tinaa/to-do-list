import { ITokensRepository } from '../../src/repositories/interfaces/tokens.repository.interface';
import { TokensMemoryRepository } from '../../src/repositories/memory/tokens.memory.repository';
import { TokensSQLRepository } from '../../src/repositories/sql/tokens.sql.repository';

jest.mock('../../src/config/database.config', () => ({
  getDatabaseConfig: jest.fn(),
}));

const mockPoolQuery = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockPoolQuery,
  })),
}));

describe('Tokens Repository', () => {
  describe('TokensMemoryRepository', () => {
    let tokensRepository: ITokensRepository;

    beforeEach(() => {
      tokensRepository = new TokensMemoryRepository();
    });

    it('should create and find a token', async () => {
      const userId = 'user123';
      const refreshToken = 'refresh123';
      const expiresIn = new Date(Date.now() + 3600000);

      await tokensRepository.create(userId, refreshToken, expiresIn);
      const foundToken = await tokensRepository.findByRefreshToken(refreshToken);
      expect(foundToken).toBeDefined();
      expect(foundToken?.userId).toBe(userId);
      expect(foundToken?.refreshToken).toBe(refreshToken);
      expect(foundToken?.expiresIn.getTime()).toBe(expiresIn.getTime());
    });

    it('should return null if token not found', async () => {
      const foundToken = await tokensRepository.findByRefreshToken('nonexistent');
      expect(foundToken).toBeNull();
    });

    it('should return null if token is expired', async () => {
      const userId = 'user123';
      const refreshToken = 'expiredtoken';
      const expiresIn = new Date(Date.now() - 3600000);
      await tokensRepository.create(userId, refreshToken, expiresIn);
      const foundToken = await tokensRepository.findByRefreshToken(refreshToken);
      expect(foundToken).toBeNull();
    });

    it('should revoke a token', async () => {
      const userId = 'user123';
      const refreshToken = 'torevoke';
      const expiresIn = new Date(Date.now() + 3600000);
      await tokensRepository.create(userId, refreshToken, expiresIn);
      await tokensRepository.revokeToken(refreshToken);
      const foundToken = await tokensRepository.findByRefreshToken(refreshToken);
      expect(foundToken).toBeNull();
    });

    it('should clean expired tokens', async () => {
      await tokensRepository.create('u1', 't1', new Date(Date.now() - 1000));
      await tokensRepository.create('u2', 't2', new Date(Date.now() + 10000));
      await tokensRepository.create('u3', 't3', new Date(Date.now() - 500));
      await tokensRepository.cleanExpiredTokens();
      expect(await tokensRepository.findByRefreshToken('t2')).toBeDefined();
      expect(await tokensRepository.findByRefreshToken('t1')).toBeNull();
      expect(await tokensRepository.findByRefreshToken('t3')).toBeNull();
    });
  });

  describe('TokensSQLRepository (Mocked)', () => {
    let tokensRepository: ITokensRepository;
    let mockGetDatabaseConfig: jest.Mock;

    beforeEach(() => {
      mockPoolQuery.mockClear();
      mockGetDatabaseConfig = require('../../src/config/database.config').getDatabaseConfig;
      mockGetDatabaseConfig.mockReturnValue({ inMemory: false, database: 'testdb' });
      const { Pool } = require('pg');
      const mockPool = new Pool();
      tokensRepository = new TokensSQLRepository(mockPool);
    });

    it('should create a token', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 });
      await tokensRepository.create('user123', 'sqlrefresh123', new Date());
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tokens'),
        ['user123', 'sqlrefresh123', expect.any(String)]
      );
    });

    it('should find a token by refresh token', async () => {
      const mockDbToken = {
        user_id: 'user123',
        refresh_token: 'sqlrefresh123',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockDbToken] });
      const foundToken = await tokensRepository.findByRefreshToken('sqlrefresh123');
      expect(foundToken).toBeDefined();
      expect(foundToken?.userId).toBe(mockDbToken.user_id);
      expect(foundToken?.refreshToken).toBe(mockDbToken.refresh_token);
      expect(foundToken?.expiresIn.getTime()).toBe(new Date(mockDbToken.expires_at).getTime());
    });

    it('should return null if SQL token not found', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });
      expect(await tokensRepository.findByRefreshToken('nonexistent')).toBeNull();
    });

    it('should revoke a token', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 });
      await tokensRepository.revokeToken('torevoke');
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM tokens'),
        ['torevoke']
      );
    });

    it('should clean expired tokens', async () => {
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 2 });
      await tokensRepository.cleanExpiredTokens();
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
      const [query] = mockPoolQuery.mock.calls[0];
      expect(query).toContain('DELETE FROM tokens');
      expect(query).toContain('WHERE expires_at <= NOW();');
    });
  });
});
