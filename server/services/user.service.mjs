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
}

export default new UserService();
