"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidatedEnv = void 0;
const zod_1 = require("zod");
// Schema for raw environment variables (all strings)
const rawEnvSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('3000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: zod_1.z.string().default('info'),
    ACCESS_TOKEN_SECRET: zod_1.z.string(),
    REFRESH_TOKEN_SECRET: zod_1.z.string(),
    ACCESS_TOKEN_EXPIRES_IN: zod_1.z.string().default('1h'),
    REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default('7d'),
    DB_CONNECTION: zod_1.z.enum(['postgres', 'memory']).default('postgres'),
    DB_HOST: zod_1.z.string().optional(),
    DB_PORT: zod_1.z.string().optional(), // Keep as string for raw env
    DB_USER: zod_1.z.string().optional(),
    DB_PASSWORD: zod_1.z.string().optional(),
    DB_NAME: zod_1.z.string().optional(),
    DATABASE_URL: zod_1.z.string().optional(),
});
// Schema for parsed environment variables with coerced types
const parsedEnvSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: zod_1.z.string().default('info'),
    ACCESS_TOKEN_SECRET: zod_1.z.string(),
    REFRESH_TOKEN_SECRET: zod_1.z.string(),
    ACCESS_TOKEN_EXPIRES_IN: zod_1.z.string().default('1h'),
    REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default('7d'),
    DB_CONNECTION: zod_1.z.enum(['postgres', 'memory']).default('postgres'),
    DB_HOST: zod_1.z.string().optional(),
    DB_PORT: zod_1.z.coerce.number().optional(), // Coerced to number for usage
    DB_USER: zod_1.z.string().optional(),
    DB_PASSWORD: zod_1.z.string().optional(),
    DB_NAME: zod_1.z.string().optional(),
    DATABASE_URL: zod_1.z.string().optional(),
});
const getValidatedEnv = () => {
    try {
        rawEnvSchema.parse(process.env); // Validate raw strings first
        return parsedEnvSchema.parse(process.env); // Then parse with coerced types
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error('Invalid environment variables:', error.format());
        }
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
        else {
            // Re-throw in test environment so Jest can catch it
            throw error;
        }
    }
};
exports.getValidatedEnv = getValidatedEnv;
