"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSQLRepository = void 0;
const uuid_1 = require("uuid");
const errors_1 = require("../../utils/errors");
class UserSQLRepository {
    constructor(pool) {
        this.pool = pool;
    }
    // Helper to convert DB row to User model with ISO strings
    dbRowToUser(row) {
        return {
            id: row.id,
            email: row.email,
            password: row.password,
            firstName: row.first_name,
            lastName: row.last_name,
            createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
            updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
            isActive: row.is_active,
            lastLoginAt: row.last_login_at
                ? (row.last_login_at instanceof Date ? row.last_login_at.toISOString() : row.last_login_at)
                : null,
        };
    }
    async create(user) {
        if (!user.email || !user.password || !user.firstName || !user.lastName) {
            throw new Error('Missing required user fields');
        }
        try {
            const newId = (0, uuid_1.v4)();
            const query = `
        INSERT INTO users (id, email, password, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, created_at, updated_at, last_login_at, is_active;
      `;
            const values = [newId, user.email, user.password, user.firstName, user.lastName];
            const result = await this.pool.query(query, values);
            return this.dbRowToUser(result.rows[0]);
        }
        catch (error) {
            if (error.code === '23505') {
                throw new errors_1.ConflictError(`User with email ${user.email} already exists.`);
            }
            throw error;
        }
    }
    async findByEmail(email) {
        const query = 'SELECT id, email, first_name, last_name, created_at, updated_at, last_login_at, is_active FROM users WHERE email = $1;';
        const result = await this.pool.query(query, [email]);
        const foundUser = result.rows[0];
        if (!foundUser)
            return null;
        return this.dbRowToUser(foundUser);
    }
    async findById(id) {
        const query = 'SELECT id, email, first_name, last_name, created_at, updated_at, last_login_at, is_active FROM users WHERE id = $1;';
        const result = await this.pool.query(query, [id]);
        const foundUser = result.rows[0];
        if (!foundUser)
            return null;
        return this.dbRowToUser(foundUser);
    }
    async update(id, updates) {
        const setClauses = [];
        const values = [];
        let paramIndex = 1;
        for (const key in updates) {
            if (Object.prototype.hasOwnProperty.call(updates, key)) {
                const dbFieldName = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                setClauses.push(`${dbFieldName} = $${paramIndex}`);
                values.push(updates[key]);
                paramIndex++;
            }
        }
        if (setClauses.length === 0) {
            // No updates provided, return the existing user after fetching it to ensure it exists
            const existingUser = await this.findById(id);
            if (!existingUser) {
                throw new errors_1.NotFoundError(`User with ID ${id} not found.`);
            }
            return existingUser;
        }
        setClauses.push(`updated_at = $${paramIndex}`);
        values.push(new Date().toISOString());
        paramIndex++;
        values.push(id); // For WHERE clause
        const query = `
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, first_name, last_name, created_at, updated_at, last_login_at, is_active;
    `;
        const result = await this.pool.query(query, values);
        if (result.rowCount === 0) {
            throw new errors_1.NotFoundError(`User with ID ${id} not found.`);
        }
        return this.dbRowToUser(result.rows[0]);
    }
    async delete(id) {
        const query = 'DELETE FROM users WHERE id = $1;';
        const result = await this.pool.query(query, [id]);
        if (result.rowCount === 0) {
            throw new errors_1.NotFoundError(`User with ID ${id} not found.`);
        }
    }
}
exports.UserSQLRepository = UserSQLRepository;
