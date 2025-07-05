import { JwtUtil } from '../../src/utils/jwt.util';
import jwt from 'jsonwebtoken';

// Mock the getJwtConfig to provide consistent test environment
jest.mock('../../src/config/jwt.config', () => ({
  getJwtConfig: () => ({
    accessTokenSecret: 'testAccessTokenSecret',
    refreshTokenSecret: 'testRefreshTokenSecret',
    accessTokenExpiresIn: '1h',
    refreshTokenExpiresIn: '7d',
  }),
}));

describe('JwtUtil', () => {
  const payload = { userId: '123', email: 'test@example.com' };

  it('should generate a valid access token', () => {
    const token = JwtUtil.generateAccessToken(payload);
    expect(token).toBeDefined();
    const decoded = jwt.verify(token, 'testAccessTokenSecret');
    expect(decoded).toMatchObject(payload);
    expect(typeof decoded).toBe('object');
  });

  it('should generate a valid refresh token', () => {
    const token = JwtUtil.generateRefreshToken(payload);
    expect(token).toBeDefined();
    const decoded = jwt.verify(token, 'testRefreshTokenSecret');
    expect(decoded).toMatchObject(payload);
    expect(typeof decoded).toBe('object');
  });

  it('should verify a valid access token', () => {
    const token = JwtUtil.generateAccessToken(payload);
    const decoded = JwtUtil.verifyToken(token, 'access');
    expect(decoded).toMatchObject(payload);
  });

  it('should verify a valid refresh token', () => {
    const token = JwtUtil.generateRefreshToken(payload);
    const decoded = JwtUtil.verifyToken(token, 'refresh');
    expect(decoded).toMatchObject(payload);
  });

  it('should throw error for invalid access token', () => {
    const invalidToken = 'invalid.access.token';
    expect(() => JwtUtil.verifyToken(invalidToken, 'access')).toThrow(jwt.JsonWebTokenError);
  });

  it('should throw error for invalid refresh token', () => {
    const invalidToken = 'invalid.refresh.token';
    expect(() => JwtUtil.verifyToken(invalidToken, 'refresh')).toThrow(jwt.JsonWebTokenError);
  });

  it('should throw TokenExpiredError for an expired access token', () => {
    // Manually create an expired token for testing
    const expiredToken = jwt.sign(payload, 'testAccessTokenSecret', { expiresIn: '0s' });
    // Wait for the token to expire
    return new Promise(resolve => setTimeout(() => {
      expect(() => JwtUtil.verifyToken(expiredToken, 'access')).toThrow(jwt.TokenExpiredError);
      resolve(null);
    }, 1000)); // Wait 1 second to ensure token expires
  });
}); 