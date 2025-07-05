"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokensSQLRepository = void 0;
class TokensSQLRepository {
    constructor(pool) {
        this.pool = pool;
    }
    async create(userId, refreshToken, expiresIn) {
        const query = `
      INSERT INTO tokens (user_id, refresh_token, expires_at)
      VALUES ($1, $2, $3);
    `;
        const values = [userId, refreshToken, expiresIn.toISOString()];
        await this.pool.query(query, values);
    }
    async findByRefreshToken(refreshToken) {
        const query = `
      SELECT user_id, refresh_token, expires_at
      FROM tokens
      WHERE refresh_token = $1 AND expires_at > NOW();
    `;
        const result = await this.pool.query(query, [refreshToken]);
        const foundToken = result.rows[0];
        if (!foundToken)
            return null;
        return {
            userId: foundToken.user_id,
            refreshToken: foundToken.refresh_token,
            expiresIn: new Date(foundToken.expires_at),
        };
    }
    async revokeToken(refreshToken) {
        const query = `
      DELETE FROM tokens
      WHERE refresh_token = $1;
    `;
        await this.pool.query(query, [refreshToken]);
    }
    async cleanExpiredTokens() {
        const query = `
      DELETE FROM tokens
      WHERE expires_at <= NOW();
    `;
        await this.pool.query(query);
    }
}
exports.TokensSQLRepository = TokensSQLRepository;
