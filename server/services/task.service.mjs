/**
 * Task Service
 * Handles all task-related database operations
 */
import db from '../db/database.mjs';

class TaskService {
  /**
   * Verify if user has access to the list (owner or collaborator)
   * @param {number} listId - List ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} List object if access granted
   * @throws {Error} If list not found or access denied
   */
  async verifyListAccess(listId, userId) {
    try {
      const query = `
        SELECT l.id, l.owner_id
        FROM lists l
        LEFT JOIN collaborators lc ON l.id = lc.list_id AND lc.user_id = ?
        WHERE l.id = ? AND (l.owner_id = ? OR lc.user_id IS NOT NULL)
      `;

      const list = db.prepare(query).get(userId, listId, userId);

      if (!list) {
        const error = new Error('Access denied or list not found');
        error.statusCode = 403;
        error.error = 'Forbidden';
        throw error;
      }

      return list;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      throw new Error(`Failed to verify list access: ${error.message}`);
    }
  }

  /**
   * Verify if user has access to the task (through list ownership or collaboration)
   * @param {number} taskId - Task ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Task object with list info if access granted
   * @throws {Error} If task not found or access denied
   */
  async verifyTaskAccess(taskId, userId) {
    try {
      const query = `
        SELECT t.*, l.owner_id
        FROM tasks t
        JOIN lists l ON t.list_id = l.id
        LEFT JOIN collaborators lc ON l.id = lc.list_id AND lc.user_id = ?
        WHERE t.id = ? AND (l.owner_id = ? OR lc.user_id IS NOT NULL)
      `;

      const task = db.prepare(query).get(userId, taskId, userId);

      if (!task) {
        const error = new Error('Task not found or access denied');
        error.statusCode = 404;
        error.error = 'Not Found';
        throw error;
      }

      return task;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      throw new Error(`Failed to verify task access: ${error.message}`);
    }
  }

  /**
   * Get task by ID
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} Task object
   * @throws {Error} If task not found
   */
  async getTaskById(taskId) {
    try {
      const query = `
        SELECT id, list_id, title, status, sort_order, created_at, updated_at
        FROM tasks
        WHERE id = ?
      `;

      const task = db.prepare(query).get(taskId);

      if (!task) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        error.error = 'Not Found';
        throw error;
      }

      return task;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      throw new Error(`Failed to fetch task: ${error.message}`);
    }
  }

  /**
   * Create or update task (upsert pattern)
   * @param {number} listId - List ID
   * @param {number} userId - User ID
   * @param {Object} data - Task data
   * @param {number} [data.taskId] - Task ID (if updating)
   * @param {string} data.title - Task title (required)
   * @param {string} [data.status] - Task status: 'todo', 'in_progress', 'done'
   * @param {number} [data.sort_order] - Sort order
   * @returns {Promise<Object>} Created or updated task object
   */
  async upsertTask(listId, userId, data) {
    try {
      const { sort_order, status, taskId, title } = data;

      // Verify user has access to the list
      await this.verifyListAccess(listId, userId);

      if (taskId) {
        // UPDATE scenario - verify task exists and belongs to the list
        const existingTask = await this.verifyTaskAccess(taskId, userId);

        if (existingTask.list_id !== listId) {
          const error = new Error('Task does not belong to the specified list');
          error.statusCode = 409;
          error.error = 'Conflict';
          throw error;
        }

        // Build dynamic UPDATE query
        const fields = [];
        const values = [];

        fields.push('title = ?');
        values.push(title);

        if (status !== undefined) {
          fields.push('status = ?');
          values.push(status);
        }

        if (sort_order !== undefined) {
          fields.push('sort_order = ?');
          values.push(sort_order);
        }

        values.push(taskId);

        const updateQuery = `
          UPDATE tasks
          SET ${fields.join(', ')}
          WHERE id = ?
        `;

        db.prepare(updateQuery).run(...values);

        // Return updated task
        return this.getTaskById(taskId);
      }

      // CREATE scenario - insert new task
      const insertQuery = `
        INSERT INTO tasks (list_id, title, status, sort_order)
        VALUES (?, ?, ?, ?)
      `;

      const stmt = db.prepare(insertQuery);
      const result = stmt.run(
        listId,
        title,
        status || 'todo',
        sort_order !== undefined ? sort_order : 0,
      );

      // Return created task
      return this.getTaskById(result.lastInsertRowid);
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      throw new Error(`Failed to upsert task: ${error.message}`);
    }
  }

  /**
   * Delete task
   * @param {number} taskId - Task ID
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteTask(taskId, userId) {
    try {
      // Verify user has access to the task
      await this.verifyTaskAccess(taskId, userId);

      const query = `DELETE FROM tasks WHERE id = ?`;
      db.prepare(query).run(taskId);
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  /**
   * Reorder tasks in a list
   * @param {number} listId - List ID
   * @param {number} userId - User ID
   * @param {Array<Object>} order - Array of {id, position} objects
   * @returns {Promise<Object>} Success response with count of updated tasks
   */
  async reorderTasks(listId, userId, order) {
    try {
      // Verify user has access to the list
      await this.verifyListAccess(listId, userId);

      // Verify all tasks belong to the list
      const taskIds = order.map((item) => item.id);
      const placeholders = taskIds.map(() => '?').join(', ');

      const verifyQuery = `
        SELECT id FROM tasks
        WHERE id IN (${placeholders}) AND list_id = ?
      `;

      const foundTasks = db.prepare(verifyQuery).all(...taskIds, listId);

      if (foundTasks.length !== taskIds.length) {
        const error = new Error(
          'One or more tasks do not belong to the specified list',
        );
        error.statusCode = 404;
        error.error = 'Not Found';
        throw error;
      }

      // Verify unique positions
      const positions = order.map((item) => item.position);
      const uniquePositions = new Set(positions);
      if (positions.length !== uniquePositions.size) {
        const error = new Error('Duplicate positions found in order array');
        error.statusCode = 400;
        error.error = 'Bad Request';
        throw error;
      }

      // Execute updates in a transaction
      const updateStmt = db.prepare(
        'UPDATE tasks SET sort_order = ? WHERE id = ?',
      );

      const transaction = db.transaction((orderItems) => {
        orderItems.forEach((item) => {
          updateStmt.run(item.position, item.id);
        });
      });

      transaction(order);

      return {
        success: true,
        updated: order.length,
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      throw new Error(`Failed to reorder tasks: ${error.message}`);
    }
  }
}

export default new TaskService();
