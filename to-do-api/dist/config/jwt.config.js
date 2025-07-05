"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtConfig = void 0;
const env_config_1 = require("./env.config");
const getJwtConfig = () => {
    const env = (0, env_config_1.getValidatedEnv)();
    return {
        accessTokenSecret: env.ACCESS_TOKEN_SECRET,
        refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
        accessTokenExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
        refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    };
};
exports.getJwtConfig = getJwtConfig;
