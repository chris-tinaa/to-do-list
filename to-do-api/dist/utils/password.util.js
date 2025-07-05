"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordUtil = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const SALT_ROUNDS = 10;
/**
 * `PasswordUtil` provides utility methods for password hashing and comparison.
 */
class PasswordUtil {
    /**
     * Hashes a given password using bcrypt.
     * @param password The plain text password to hash.
     * @returns A promise that resolves to the hashed password.
     */
    async hashPassword(password) {
        return bcrypt_1.default.hash(password, SALT_ROUNDS);
    }
    /**
     * Compares a plain text password with a hashed password.
     * @param password The plain text password.
     * @param hash The hashed password to compare against.
     * @returns A promise that resolves to true if the passwords match, false otherwise.
     */
    async comparePassword(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
    /**
     * Validates the strength of a password based on predefined criteria.
     * @param password The password string to validate.
     * @returns An object indicating if the password is valid and a list of errors if any.
     */
    validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push("Password must be at least 8 characters long.");
        }
        if (!/[A-Z]/.test(password)) {
            errors.push("Password must contain at least one uppercase letter.");
        }
        if (!/[a-z]/.test(password)) {
            errors.push("Password must contain at least one lowercase letter.");
        }
        if (!/[0-9]/.test(password)) {
            errors.push("Password must contain at least one number.");
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            errors.push("Password must contain at least one special character.");
        }
        return { isValid: errors.length === 0, errors };
    }
}
exports.PasswordUtil = PasswordUtil;
