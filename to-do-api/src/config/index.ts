import { AppConfig, getAppConfig } from "./app.config";
import { DatabaseConfig, getDatabaseConfig } from "./database.config";
import { JwtConfig, getJwtConfig } from "./jwt.config";

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
}

export const getConfig = (): Config => {
  return {
    app: getAppConfig(),
    database: getDatabaseConfig(),
    jwt: getJwtConfig(),
  };
}; 