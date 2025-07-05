"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokensRepository = exports.getUserRepository = void 0;
const user_memory_repository_1 = require("./memory/user.memory.repository");
const user_sql_repository_1 = require("./sql/user.sql.repository");
const tokens_memory_repository_1 = require("./memory/tokens.memory.repository");
const tokens_sql_repository_1 = require("./sql/tokens.sql.repository");
const database_config_1 = require("../config/database.config");
const pg_1 = require("pg");
let pool = null;
const getUserRepository = () => {
    const dbConfig = (0, database_config_1.getDatabaseConfig)();
    if (dbConfig.inMemory) {
        return new user_memory_repository_1.UserMemoryRepository();
    }
    else {
        if (!pool) {
            pool = new pg_1.Pool({
                user: dbConfig.user,
                host: dbConfig.host,
                database: dbConfig.database,
                password: dbConfig.password,
                port: dbConfig.port,
            });
        }
        return new user_sql_repository_1.UserSQLRepository(pool);
    }
};
exports.getUserRepository = getUserRepository;
const getTokensRepository = () => {
    const dbConfig = (0, database_config_1.getDatabaseConfig)();
    if (dbConfig.inMemory) {
        return new tokens_memory_repository_1.TokensMemoryRepository();
    }
    else {
        if (!pool) {
            pool = new pg_1.Pool({
                user: dbConfig.user,
                host: dbConfig.host,
                database: dbConfig.database,
                password: dbConfig.password,
                port: dbConfig.port,
            });
        }
        return new tokens_sql_repository_1.TokensSQLRepository(pool);
    }
};
exports.getTokensRepository = getTokensRepository;
