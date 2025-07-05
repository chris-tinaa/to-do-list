"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokensMemoryRepository = void 0;
class TokensMemoryRepository {
    constructor() {
        this.tokens = [];
    }
    async create(userId, refreshToken, expiresIn) {
        this.tokens.push({ userId, refreshToken, expiresIn });
    }
    async findByRefreshToken(refreshToken) {
        const token = this.tokens.find(token => token.refreshToken === refreshToken && token.expiresIn > new Date());
        return token || null;
    }
    async revokeToken(refreshToken) {
        this.tokens = this.tokens.filter(token => token.refreshToken !== refreshToken);
    }
    async cleanExpiredTokens() {
        this.tokens = this.tokens.filter(token => token.expiresIn > new Date());
    }
}
exports.TokensMemoryRepository = TokensMemoryRepository;
