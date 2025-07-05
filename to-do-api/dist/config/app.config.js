"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppConfig = void 0;
const env_config_1 = require("./env.config");
const getAppConfig = () => {
    const env = (0, env_config_1.getValidatedEnv)();
    return {
        port: env.PORT,
        env: env.NODE_ENV,
        logLevel: env.LOG_LEVEL,
    };
};
exports.getAppConfig = getAppConfig;
