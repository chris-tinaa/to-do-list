"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = void 0;
const env_config_1 = require("./env.config");
const getDatabaseConfig = () => {
    const env = (0, env_config_1.getValidatedEnv)();
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
exports.getDatabaseConfig = getDatabaseConfig;
