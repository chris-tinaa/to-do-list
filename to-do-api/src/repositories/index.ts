import { UserRepository } from './interfaces/user.repository.interface';
import { UserSQLRepository } from './sql/user.sql.repository';
import { ITokensRepository } from './interfaces/tokens.repository.interface';
import { TokensMemoryRepository } from './memory/tokens.memory.repository';
import { TokensSQLRepository } from './sql/tokens.sql.repository';
import { getDatabaseConfig } from '../config/database.config';
import { Pool } from 'pg';
import { UserMemoryRepository } from './memory/user.memory.repository';

let pool: Pool | null = null;

export const getUserRepository = (): UserRepository => {
  const dbConfig = getDatabaseConfig();
  if (dbConfig.inMemory) {
    return new UserMemoryRepository();
  } else {
    if (!pool) {
      pool = new Pool({
        user: dbConfig.user,
        host: dbConfig.host,
        database: dbConfig.database,
        password: dbConfig.password,
        port: dbConfig.port,
      });
    }
    return new UserSQLRepository(pool);
  }
};

export const getTokensRepository = (): ITokensRepository => {
  const dbConfig = getDatabaseConfig();
  if (dbConfig.inMemory) {
    return new TokensMemoryRepository();
  } else {
    if (!pool) {
      pool = new Pool({
        user: dbConfig.user,
        host: dbConfig.host,
        database: dbConfig.database,
        password: dbConfig.password,
        port: dbConfig.port,
      });
    }
    return new TokensSQLRepository(pool);
  }
}; 