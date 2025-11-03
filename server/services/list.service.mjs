/**
 * List Service
 * Handles all list-related database operations
 */
import db from '../db/database.mjs';

class ListService {
  /**
   * Get all lists by owner ID with tasks, collaborators, and owner info
   * @param {number} ownerId - User ID of the list owner
   * @returns {Promise<Array>} Array of list objects with nested tasks and collaborators
   */
  async getListsByOwnerId(ownerId) {
    try {
      // Get all lists owned by the user
      const listsQuery = `
        SELECT
          l.id, l.title, l.owner_id, l.category_id, l.priority, l.due_date,
          l.is_archived, l.archived_at, l.created_at, l.updated_at,
          u.email as owner_email
        FROM lists l
        JOIN users u ON l.owner_id = u.id
        WHERE l.owner_id = ?
        ORDER BY l.created_at DESC
      `;

      const lists = db.prepare(listsQuery).all(ownerId);

      // For each list, get tasks and collaborators
      const listsWithDetails = lists.map((list) => {
        // Get tasks for this list
        const tasksQuery = `
          SELECT id, list_id, title, status, sort_order, created_at, updated_at
          FROM tasks
          WHERE list_id = ?
          ORDER BY sort_order ASC, created_at ASC
        `;
        const tasks = db.prepare(tasksQuery).all(list.id);

        // Get collaborators for this list
        const collaboratorsQuery = `
          SELECT
            c.id, c.list_id, c.user_id, c.role, c.added_at,
            u.email as user_email
          FROM collaborators c
          JOIN users u ON c.user_id = u.id
          WHERE c.list_id = ?
          ORDER BY c.added_at ASC
        `;
        const collaborators = db.prepare(collaboratorsQuery).all(list.id);

        return {
          ...list,
          owner: list.owner_email,
          tasks,
          collaborators,
        };
      });

      return listsWithDetails;
    } catch (error) {
      throw new Error(`Failed to fetch lists: ${error.message}`);
    }
  }

  /**
   * Get all lists where user is a collaborator with tasks, collaborators, and owner info
   * @param {number} userId - User ID of the collaborator
   * @returns {Promise<Array>} Array of list objects with nested tasks and collaborators
   */
  async getListsAsCollaborator(userId) {
    try {
      // Get all lists where user is a collaborator
      const listsQuery = `
        SELECT
          l.id, l.title, l.owner_id, l.category_id, l.priority, l.due_date,
          l.is_archived, l.archived_at, l.created_at, l.updated_at,
          u.email as owner_email
        FROM lists l
        JOIN collaborators c ON l.id = c.list_id
        JOIN users u ON l.owner_id = u.id
        WHERE c.user_id = ?
        ORDER BY l.created_at DESC
      `;

      const lists = db.prepare(listsQuery).all(userId);

      // For each list, get tasks and collaborators
      const listsWithDetails = lists.map((list) => {
        // Get tasks for this list
        const tasksQuery = `
          SELECT id, list_id, title, status, sort_order, created_at, updated_at
          FROM tasks
          WHERE list_id = ?
          ORDER BY sort_order ASC, created_at ASC
        `;
        const tasks = db.prepare(tasksQuery).all(list.id);

        // Get collaborators for this list
        const collaboratorsQuery = `
          SELECT
            c.id, c.list_id, c.user_id, c.role, c.added_at,
            u.email as user_email
          FROM collaborators c
          JOIN users u ON c.user_id = u.id
          WHERE c.list_id = ?
          ORDER BY c.added_at ASC
        `;
        const collaborators = db.prepare(collaboratorsQuery).all(list.id);

        return {
          ...list,
          owner: list.owner_email,
          tasks,
          collaborators,
        };
      });

      return listsWithDetails;
    } catch (error) {
      throw new Error(`Failed to fetch collaborator lists: ${error.message}`);
    }
  }

  /**
   * Create a new list
   * @param {number} ownerId - User ID of the list owner
   * @param {Object} data - List data
   * @param {string} data.title - List title (required)
   * @param {number} [data.category_id] - Category ID (optional)
   * @param {string} [data.priority] - Priority: 'low', 'normal', 'high' (default: 'normal')
   * @param {string} [data.due_date] - Due date in YYYY-MM-DD format (optional)
   * @returns {Promise<Object>} Created list object
   */
  async createList(ownerId, data) {
    try {
      const {
        category_id = null,
        due_date = null,
        priority = 'normal',
        title,
      } = data;

      const query = `
        INSERT INTO lists (title, owner_id, category_id, priority, due_date)
        VALUES (?, ?, ?, ?, ?)
      `;

      const stmt = db.prepare(query);
      const result = stmt.run(title, ownerId, category_id, priority, due_date);

      // Fetch and return the created list
      return this.getListById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`Failed to create list: ${error.message}`);
    }
  }

  /**
   * Update an existing list
   * @param {number} listId - List ID
   * @param {number} userId - User ID (for ownership verification)
   * @param {Object} data - Fields to update
   * @returns {Promise<Object>} Updated list object
   */
  async updateList(listId, userId, data) {
    try {
      // Build dynamic UPDATE query based on provided fields
      const fields = [];
      const values = [];

      if (data.title !== undefined) {
        fields.push('title = ?');
        values.push(data.title);
      }
      if (data.category_id !== undefined) {
        fields.push('category_id = ?');
        values.push(data.category_id);
      }
      if (data.priority !== undefined) {
        fields.push('priority = ?');
        values.push(data.priority);
      }
      if (data.due_date !== undefined) {
        fields.push('due_date = ?');
        values.push(data.due_date);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      // Add listId and userId for WHERE clause
      values.push(listId, userId);

      const query = `
        UPDATE lists
        SET ${fields.join(', ')}
        WHERE id = ? AND owner_id = ?
      `;

      const stmt = db.prepare(query);
      const result = stmt.run(...values);

      if (result.changes === 0) {
        return null; // No rows updated (list not found or user is not owner)
      }

      // Fetch and return the updated list
      return this.getListById(listId);
    } catch (error) {
      throw new Error(`Failed to update list: ${error.message}`);
    }
  }

  /**
   * Get list by ID
   * @param {number} listId - List ID
   * @returns {Promise<Object|null>} List object or null if not found
   */
  async getListById(listId) {
    try {
      const query = `
        SELECT id, title, owner_id, category_id, priority, due_date,
               is_archived, archived_at, created_at, updated_at
        FROM lists
        WHERE id = ?
      `;

      const list = db.prepare(query).get(listId);
      return list || null;
    } catch (error) {
      throw new Error(`Failed to fetch list: ${error.message}`);
    }
  }

  /**
   * Delete a list (hard delete with cascading)
   * @param {number} listId - List ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteList(listId) {
    try {
      const query = 'DELETE FROM lists WHERE id = ?';
      const stmt = db.prepare(query);
      const result = stmt.run(listId);

      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete list: ${error.message}`);
    }
  }

  /**
   * Check if user is the owner of a list
   * @param {number} listId - List ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if user is the owner
   */
  async isListOwner(listId, userId) {
    try {
      const query =
        'SELECT COUNT(*) as count FROM lists WHERE id = ? AND owner_id = ?';
      const result = db.prepare(query).get(listId, userId);
      return result.count > 0;
    } catch (error) {
      throw new Error(`Failed to check list ownership: ${error.message}`);
    }
  }

  /**
   * Check if list is archived
   * @param {number} listId - List ID
   * @returns {Promise<boolean>} True if list is archived
   */
  async isListArchived(listId) {
    try {
      const query = 'SELECT is_archived FROM lists WHERE id = ?';
      const result = db.prepare(query).get(listId);
      return result ? result.is_archived === 1 : false;
    } catch (error) {
      throw new Error(`Failed to check list archive status: ${error.message}`);
    }
  }

  /**
   * Validate that category exists
   * @param {number} categoryId - Category ID
   * @returns {Promise<boolean>} True if category exists
   */
  async validateCategoryExists(categoryId) {
    if (!categoryId) {
      return true;
    } // null/undefined is valid (optional field)

    try {
      const query = 'SELECT COUNT(*) as count FROM categories WHERE id = ?';
      const result = db.prepare(query).get(categoryId);
      return result.count > 0;
    } catch (error) {
      throw new Error(`Failed to validate category: ${error.message}`);
    }
  }

  /**
   * Archive a list
   * @param {number} listId - List ID
   * @param {number} userId - User ID (for ownership verification)
   * @returns {Promise<Object>} Updated list object
   */
  async archiveList(listId, userId) {
    try {
      const query = `
        UPDATE lists
        SET is_archived = TRUE
        WHERE id = ? AND owner_id = ?
      `;

      const stmt = db.prepare(query);
      const result = stmt.run(listId, userId);

      if (result.changes === 0) {
        return null; // No rows updated (list not found or user is not owner)
      }

      // Fetch and return the updated list
      return this.getListById(listId);
    } catch (error) {
      throw new Error(`Failed to archive list: ${error.message}`);
    }
  }

  /**
   * Add a collaborator to a list
   * @param {number} listId - List ID
   * @param {number} collaboratorUserId - User ID of the collaborator to add
   * @returns {Promise<Object>} Created collaborator object
   */
  async addCollaborator(listId, collaboratorUserId) {
    try {
      const query = `
        INSERT INTO collaborators (list_id, user_id, role)
        VALUES (?, ?, 'collaborator')
      `;

      const stmt = db.prepare(query);
      const result = stmt.run(listId, collaboratorUserId);

      // Fetch and return the created collaborator
      const selectQuery = `
        SELECT
          c.id, c.list_id, c.user_id, c.role, c.added_at,
          u.email as user_email
        FROM collaborators c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `;

      return db.prepare(selectQuery).get(result.lastInsertRowid);
    } catch (error) {
      // Check for unique constraint violation (user already a collaborator)
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('User is already a collaborator on this list');
      }
      throw new Error(`Failed to add collaborator: ${error.message}`);
    }
  }

  /**
   * Remove a collaborator from a list
   * @param {number} listId - List ID
   * @param {number} collaboratorId - Collaborator record ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async removeCollaborator(listId, collaboratorId) {
    try {
      const query = 'DELETE FROM collaborators WHERE id = ? AND list_id = ?';
      const stmt = db.prepare(query);
      const result = stmt.run(collaboratorId, listId);

      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to remove collaborator: ${error.message}`);
    }
  }

  /**
   * Get collaborator by ID
   * @param {number} collaboratorId - Collaborator record ID
   * @returns {Promise<Object|null>} Collaborator object or null if not found
   */
  async getCollaboratorById(collaboratorId) {
    try {
      const query = `
        SELECT
          c.id, c.list_id, c.user_id, c.role, c.added_at,
          u.email as user_email
        FROM collaborators c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `;

      const collaborator = db.prepare(query).get(collaboratorId);
      return collaborator || null;
    } catch (error) {
      throw new Error(`Failed to fetch collaborator: ${error.message}`);
    }
  }

  /**
   * Check if user exists
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if user exists
   */
  async userExists(userId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM users WHERE id = ?';
      const result = db.prepare(query).get(userId);
      return result.count > 0;
    } catch (error) {
      throw new Error(`Failed to check user existence: ${error.message}`);
    }
  }

  /**
   * Check if user is a collaborator on a list
   * @param {number} listId - List ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if user is a collaborator
   */
  async isCollaborator(listId, userId) {
    try {
      const query =
        'SELECT COUNT(*) as count FROM collaborators WHERE list_id = ? AND user_id = ?';
      const result = db.prepare(query).get(listId, userId);
      return result.count > 0;
    } catch (error) {
      throw new Error(`Failed to check collaborator status: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new ListService();
