"use strict";
/**
 * Standardized API response types
 * @see docs/prd.md section 8
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIResponse = void 0;
class APIResponse {
    constructor(statusCode, message, data = null, errorCode) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.errorCode = errorCode;
    }
}
exports.APIResponse = APIResponse;
