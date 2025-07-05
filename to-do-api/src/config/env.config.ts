import { z } from 'zod';

// Schema for raw environment variables (all strings)
const rawEnvSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('1h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  DB_CONNECTION: z.enum(['postgres', 'memory']).default('postgres'),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().optional(), // Keep as string for raw env
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

// Schema for parsed environment variables with coerced types
const parsedEnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('1h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  DB_CONNECTION: z.enum(['postgres', 'memory']).default('postgres'),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().optional(), // Coerced to number for usage
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

declare global {
  namespace NodeJS {
    // Extend ProcessEnv with the raw string types from rawEnvSchema
    interface ProcessEnv extends z.infer<typeof rawEnvSchema> {}
  }
}

export type Env = z.infer<typeof parsedEnvSchema>;

export const getValidatedEnv = (): Env => {
  try {
    rawEnvSchema.parse(process.env); // Validate raw strings first
    return parsedEnvSchema.parse(process.env); // Then parse with coerced types
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Invalid environment variables:', error.format());
    }
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    } else {
      // Re-throw in test environment so Jest can catch it
      throw error;
    }
  }
}; 