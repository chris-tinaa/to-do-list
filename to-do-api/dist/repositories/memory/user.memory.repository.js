"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMemoryRepository = void 0;
const errors_1 = require("../../utils/errors");
const uuid_1 = require("uuid");
class UserMemoryRepository {
    constructor() {
        this.users = [];
    }
    /**
     * Creates a new user in memory.
     * @param user The user object to create, excluding ID, creation/update timestamps, and active status.
     * @returns A Promise that resolves with the created user, including its generated ID and timestamps.
     * @throws {ConflictError} If a user with the same email already exists.
     */
    async create(user) {
        if (!user.email || !user.password || !user.firstName || !user.lastName) {
            throw new Error('Missing required user fields');
        }
        if (this.users.some(u => u.email === user.email)) {
            throw new errors_1.ConflictError(`User with email ${user.email} already exists.`);
        }
        const newUser = {
            id: (0, uuid_1.v4)(),
            ...user,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true, // Default to true upon creation
            lastLoginAt: null,
        };
        this.users.push(newUser);
        return newUser;
    }
    /**
     * Finds a user by their email address in memory.
     * @param email The email of the user to find.
     * @returns A Promise that resolves with the user if found, or null otherwise.
     */
    async findByEmail(email) {
        return this.users.find(user => user.email === email) || null;
    }
    /**
     * Finds a user by their ID in memory.
     * @param id The ID of the user to find.
     * @returns A Promise that resolves with the user if found, or null otherwise.
     */
    async findById(id) {
        return this.users.find(user => user.id === id) || null;
    }
    /**
     * Updates an existing user in memory.
     * @param id The ID of the user to update.
     * @param updates A partial user object containing the fields to update.
     * @returns A Promise that resolves with the updated user, or null if the user is not found.
     * @throws {NotFoundError} If the user with the given ID is not found.
     */
    async update(id, updates) {
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) {
            throw new errors_1.NotFoundError(`User with ID ${id} not found.`);
        }
        const existingUser = this.users[index];
        const updatedUser = {
            ...existingUser,
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        this.users[index] = updatedUser;
        return updatedUser;
    }
    /**
     * Deletes a user from memory.
     * @param id The ID of the user to delete.
     * @returns A Promise that resolves when the user is deleted.
     * @throws {NotFoundError} If the user with the given ID is not found.
     */
    async delete(id) {
        const initialLength = this.users.length;
        this.users = this.users.filter(user => user.id !== id);
        if (this.users.length === initialLength) {
            throw new errors_1.NotFoundError(`User with ID ${id} not found.`);
        }
    }
}
exports.UserMemoryRepository = UserMemoryRepository;
