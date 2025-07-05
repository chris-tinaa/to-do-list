// src/config/database.config.ts
import { PoolConfig } from 'pg';
import { getValidatedEnv } from './env.config';

export interface DatabaseConfig extends PoolConfig {
  databaseUrl?: string;
  inMemory: boolean;
}

export const getDatabaseConfig = (): DatabaseConfig => {
  const env = getValidatedEnv();
  const inMemory = env.NODE_ENV === 'test' || env.DB_CONNECTION === 'memory';
  if (inMemory) {
    return { inMemory: true };
  }
  return {
    inMemory: false,
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    databaseUrl: env.DATABASE_URL,
  };
}; 