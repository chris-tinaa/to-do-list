"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = void 0;
const app_config_1 = require("./app.config");
const database_config_1 = require("./database.config");
const jwt_config_1 = require("./jwt.config");
const getConfig = () => {
    return {
        app: (0, app_config_1.getAppConfig)(),
        database: (0, database_config_1.getDatabaseConfig)(),
        jwt: (0, jwt_config_1.getJwtConfig)(),
    };
};
exports.getConfig = getConfig;
