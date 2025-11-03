/**
 * User Service
 * Handles all user-related database operations
 */
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import db from '../db/database.mjs';

class UserService {
  /**
   * Get all users with filtering and pagination
   * @param {Object} filters - Filter options
   * @param {string} [filters.role] - Filter by role (user/admin)
   * @param {boolean} [filters.is_blocked] - Filter by blocked status
   * @param {number} [filters.page=1] - Page number
   * @param {number} [filters.limit=20] - Records per page
   * @returns {Promise<{users: Array, total: number}>}
   */
  async getAllUsers({ is_blocked, limit = 20, page = 1, role }) {
    let result = { users: [], total: 0 };

    try {
      // Build WHERE clause dynamically
      const conditions = [];
      const params = [];

      if (role !== undefined && role !== null) {
        conditions.push('role = ?');
        params.push(role);
      }

      if (is_blocked !== undefined && is_blocked !== null) {
        conditions.push('is_blocked = ?');
        params.push(is_blocked ? 1 : 0);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countResult = db.prepare(countQuery).get(...params);
      const { total } = countResult;

      // Get paginated users (excluding password_hash for security)
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT
          id,
          email,
          role,
          is_blocked,
          theme,
          created_at,
          updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const users = db.prepare(dataQuery).all(...params, limit, offset);

      // Format dates to ISO 8601 and convert is_blocked to boolean
      const formattedUsers = users.map((user) => ({
        ...user,
        is_blocked: Boolean(user.is_blocked),
        created_at: new Date(user.created_at).toISOString(),
        updated_at: new Date(user.updated_at).toISOString(),
      }));

      result = {
        users: formattedUsers,
        total,
      };
    } catch {
      throw new Error('Failed to retrieve users from database');
    }

    return result;
  }

  /**
   * Get user by session ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} User object or null
   */
  async getUserBySession(sessionId) {
    let result = null;

    try {
      const query = `
        SELECT u.id, u.email, u.role, u.is_blocked
        FROM users u
        INNER JOIN user_sessions s ON u.id = s.user_id
        WHERE s.id = ? AND s.expires_at > datetime('now')
      `;

      const user = db.prepare(query).get(sessionId);

      if (user) {
        result = {
          ...user,
          is_blocked: Boolean(user.is_blocked),
        };
      }
    } catch {
      throw new Error('Failed to retrieve user by session');
    }

    return result;
  }

  /**
   * Get user by email and password
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User object or null if credentials invalid
   */
  async getUserByEmailAndPassword(email, password) {
    let result = null;

    try {
      const query = `
        SELECT id, email, password_hash, role, is_blocked
        FROM users
        WHERE email = ?
        LIMIT 1
      `;

      const user = db.prepare(query).get(email);

      if (user) {
        // Verify password
        const isPasswordValid = await bcrypt.compare(
          password,
          user.password_hash,
        );

        if (isPasswordValid) {
          result = {
            ...user,
            is_blocked: Boolean(user.is_blocked),
          };
        }
      }
    } catch {
      throw new Error('Failed to retrieve user by email and password');
    }

    return result;
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User with password_hash or null
   */
  async getUserByEmail(email) {
    let result = null;

    try {
      const query = `
        SELECT id, email, password_hash, role, is_blocked
        FROM users
        WHERE email = ?
        LIMIT 1
      `;

      const user = db.prepare(query).get(email);

      if (user) {
        result = {
          ...user,
          is_blocked: Boolean(user.is_blocked),
        };
      }
    } catch {
      throw new Error('Failed to retrieve user by email');
    }

    return result;
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Bcrypt hash
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hash) {
    let result = false;

    try {
      result = await bcrypt.compare(password, hash);
    } catch {
      throw new Error('Password verification failed');
    }

    return result;
  }

  /**
   * Create new session for user
   * @param {number} userId - User ID
   * @returns {Promise<string>} Session ID (UUID)
   */
  async createSession(userId) {
    let sessionId = '';

    try {
      sessionId = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const query = `
        INSERT INTO user_sessions (id, user_id, expires_at, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `;

      db.prepare(query).run(sessionId, userId, expiresAt.toISOString());
    } catch {
      throw new Error('Failed to create session');
    }

    return sessionId;
  }

  /**
   * Delete session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} True if session was deleted
   */
  async deleteSession(sessionId) {
    let result = false;

    try {
      const query = `DELETE FROM user_sessions WHERE id = ?`;
      const deleteResult = db.prepare(query).run(sessionId);

      result = deleteResult.changes > 0;
    } catch {
      throw new Error('Failed to delete session');
    }

    return result;
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  async getUserById(userId) {
    let result = null;

    try {
      const query = `
        SELECT id, email, role, is_blocked, theme, created_at, updated_at
        FROM users
        WHERE id = ?
      `;
      const user = db.prepare(query).get(userId);

      if (user) {
        result = {
          ...user,
          is_blocked: Boolean(user.is_blocked),
          created_at: new Date(user.created_at).toISOString(),
          updated_at: new Date(user.updated_at).toISOString(),
        };
      }
    } catch {
      throw new Error('Failed to retrieve user by ID');
    }

    return result;
  }

  /**
   * Check if email exists (excluding specific user ID)
   * @param {string} email - Email to check
   * @param {number} [excludeUserId] - User ID to exclude from check
   * @returns {Promise<boolean>} True if email exists
   */
  async emailExists(email, excludeUserId = null) {
    let result = false;

    try {
      const query = `
        SELECT COUNT(*) as count
        FROM users
        WHERE email = ? AND id != ?
      `;
      const countResult = db.prepare(query).get(email, excludeUserId || 0);
      result = countResult.count > 0;
    } catch {
      throw new Error('Failed to check email existence');
    }

    return result;
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    let hashedPassword = '';

    try {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch {
      throw new Error('Failed to hash password');
    }

    return hashedPassword;
  }

  /**
   * Create new user with specific ID
   * @param {number} userId - User ID
   * @param {Object} data - User data
   * @param {string} data.email - Email address
   * @param {string} data.password_hash - Hashed password
   * @param {string} [data.role='user'] - User role
   * @param {boolean} [data.is_blocked=false] - Block status
   * @param {string|null} [data.theme=null] - Interface theme
   * @returns {Promise<Object>} Created user
   */
  async createUser(userId, data) {
    try {
      const query = `
        INSERT INTO users (id, email, password_hash, role, is_blocked, theme)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.prepare(query).run(
        userId,
        data.email,
        data.password_hash,
        data.role || 'user',
        data.is_blocked ? 1 : 0,
        data.theme || null,
      );

      // Retrieve and return the created user
      const createdUser = await this.getUserById(userId);
      return createdUser;
    } catch {
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update existing user
   * @param {number} userId - User ID
   * @param {Object} data - Partial user data
   * @param {string} [data.email] - Email address
   * @param {string} [data.password_hash] - Hashed password
   * @param {string} [data.role] - User role
   * @param {boolean} [data.is_blocked] - Block status
   * @param {string} [data.theme] - Interface theme
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, data) {
    try {
      const updates = [];
      const params = [];

      if (data.email !== undefined) {
        updates.push('email = ?');
        params.push(data.email);
      }
      if (data.password_hash !== undefined) {
        updates.push('password_hash = ?');
        params.push(data.password_hash);
      }
      if (data.role !== undefined) {
        updates.push('role = ?');
        params.push(data.role);
      }
      if (data.is_blocked !== undefined) {
        updates.push('is_blocked = ?');
        params.push(data.is_blocked ? 1 : 0);
      }
      if (data.theme !== undefined) {
        updates.push('theme = ?');
        params.push(data.theme);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      params.push(userId);

      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = ?
      `;

      db.prepare(query).run(...params);

      // Retrieve and return the updated user
      const updatedUser = await this.getUserById(userId);
      return updatedUser;
    } catch {
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete user by ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if user was deleted
   */
  async deleteUser(userId) {
    let result = false;

    try {
      // Start transaction by deleting related sessions first
      const deleteSessionsQuery = `DELETE FROM user_sessions WHERE user_id = ?`;
      db.prepare(deleteSessionsQuery).run(userId);

      // Then delete the user
      const deleteUserQuery = `DELETE FROM users WHERE id = ?`;
      const deleteResult = db.prepare(deleteUserQuery).run(userId);

      result = deleteResult.changes > 0;
    } catch {
      throw new Error('Failed to delete user');
    }

    return result;
  }
}

export default new UserService();
