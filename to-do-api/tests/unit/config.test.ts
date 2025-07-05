import { getConfig } from '../../src/config';

describe('Configuration Loading', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should load development configuration correctly', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3000';
    process.env.LOG_LEVEL = 'debug';
    process.env.ACCESS_TOKEN_SECRET = 'dev-access-secret';
    process.env.REFRESH_TOKEN_SECRET = 'dev-refresh-secret';
    process.env.DB_CONNECTION = 'postgres';

    const config = getConfig();

    expect(config.app.port).toBe(3000);
    expect(config.app.env).toBe('development');
    expect(config.app.logLevel).toBe('debug');
    expect(config.jwt.accessTokenSecret).toBe('dev-access-secret');
    expect(config.database.inMemory).toBe(false);
  });

  test('should load test configuration correctly with in-memory DB', () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '8080';
    process.env.LOG_LEVEL = 'warn';
    process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
    process.env.DB_CONNECTION = 'memory';

    const config = getConfig();

    expect(config.app.port).toBe(8080);
    expect(config.app.env).toBe('test');
    expect(config.app.logLevel).toBe('warn');
    expect(config.jwt.accessTokenSecret).toBe('test-access-secret');
    expect(config.database.inMemory).toBe(true);
  });

  test('should load production configuration with defaults if not specified', () => {
    process.env.NODE_ENV = 'production';
    process.env.ACCESS_TOKEN_SECRET = 'prod-access-secret';
    process.env.REFRESH_TOKEN_SECRET = 'prod-refresh-secret';
    // No PORT, LOG_LEVEL, DB_CONNECTION specified

    const config = getConfig();

    expect(config.app.port).toBe(3000); // Default port
    expect(config.app.env).toBe('production');
    expect(config.app.logLevel).toBe('info'); // Default log level
    expect(config.jwt.accessTokenSecret).toBe('prod-access-secret');
    expect(config.database.inMemory).toBe(false); // Default to postgres
  });

  test('should throw error if required JWT secrets are missing', () => {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '3000';
    process.env.LOG_LEVEL = 'info';
    // Missing ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET

    const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => getConfig()).toThrow(); // Expect it to throw if it tries to continue
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockError).toHaveBeenCalled();

    mockExit.mockRestore();
    mockError.mockRestore();
  });
}); 