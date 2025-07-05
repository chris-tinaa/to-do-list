import { getValidatedEnv } from './env.config';

export interface AppConfig {
  port: number;
  env: string;
  logLevel: string;
}

export const getAppConfig = (): AppConfig => {
  const env = getValidatedEnv();
  return {
    port: env.PORT,
    env: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
  };
}; 