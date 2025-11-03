/**
 * Category Service
 * Handles all category-related database operations
 */
import db from '../db/database.mjs';

class CategoryService {
  /**
   * Get all categories sorted by name
   * @returns {Promise<Array>} Array of category objects
   */
  async getAllCategories() {
    try {
      const query = `
        SELECT id, name, color, created_at
        FROM categories
        ORDER BY name
      `;

      return db.prepare(query).all();
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  /**
   * Get category by ID
   * @param {number} id - Category ID
   * @returns {Promise<Object|null>} Category object or null if not found
   */
  async getCategoryById(id) {
    try {
      const query = `
        SELECT id, name, color, created_at
        FROM categories
        WHERE id = ?
      `;

      const category = db.prepare(query).get(id);
      return category || null;
    } catch (error) {
      throw new Error(`Failed to fetch category: ${error.message}`);
    }
  }

  /**
   * Check if category exists by ID
   * @param {number} id - Category ID
   * @returns {Promise<boolean>} True if category exists
   */
  async categoryExists(id) {
    try {
      const query = 'SELECT COUNT(*) as count FROM categories WHERE id = ?';
      const result = db.prepare(query).get(id);
      return result.count > 0;
    } catch (error) {
      throw new Error(`Failed to check category existence: ${error.message}`);
    }
  }

  /**
   * Check if category name exists (excluding specific ID)
   * @param {string} name - Category name
   * @param {number} [excludeId] - ID to exclude from check
   * @returns {Promise<boolean>} True if name exists
   */
  async categoryNameExists(name, excludeId = null) {
    try {
      let query = 'SELECT COUNT(*) as count FROM categories WHERE name = ?';
      const params = [name];

      if (excludeId !== null) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      const result = db.prepare(query).get(...params);
      return result.count > 0;
    } catch (error) {
      throw new Error(`Failed to check category name: ${error.message}`);
    }
  }

  /**
   * Create or update category (UPSERT)
   * @param {number} id - Category ID
   * @param {Object} data - Category data
   * @param {string} [data.name] - Category name
   * @param {string} [data.color] - Category color (hex format)
   * @returns {Promise<{category: Object, isNew: boolean}>} Created/updated category and flag
   */
  async upsertCategory(id, data) {
    try {
      const exists = await this.categoryExists(id);

      if (!exists) {
        // CREATE MODE - both name and color required
        if (!data.name || !data.color) {
          const error = new Error(
            'Name and color are required for creating category',
          );
          error.statusCode = 400;
          throw error;
        }

        // Check if name already exists
        const nameExists = await this.categoryNameExists(data.name);
        if (nameExists) {
          const error = new Error('Category with this name already exists');
          error.statusCode = 409;
          throw error;
        }

        // Insert new category with specified ID
        const insertQuery = `
          INSERT INTO categories (id, name, color, created_at)
          VALUES (?, ?, ?, datetime('now'))
        `;

        db.prepare(insertQuery).run(id, data.name, data.color);

        const category = await this.getCategoryById(id);
        return { category, isNew: true };
      }

      // UPDATE MODE - at least one field required
      if (!data.name && !data.color) {
        const error = new Error(
          'At least one field (name or color) must be provided for update',
        );
        error.statusCode = 400;
        throw error;
      }

      // Check if name is being changed and if it conflicts
      if (data.name) {
        const nameExists = await this.categoryNameExists(data.name, id);
        if (nameExists) {
          const error = new Error('Category with this name already exists');
          error.statusCode = 409;
          throw error;
        }
      }

      // Build dynamic UPDATE query
      const updates = [];
      const params = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        params.push(data.name);
      }

      if (data.color !== undefined) {
        updates.push('color = ?');
        params.push(data.color);
      }

      params.push(id);

      const updateQuery = `
          UPDATE categories
          SET ${updates.join(', ')}
          WHERE id = ?
        `;

      db.prepare(updateQuery).run(...params);

      const category = await this.getCategoryById(id);
      return { category, isNew: false };
    } catch (error) {
      // Preserve custom error properties
      if (error.statusCode) {
        throw error;
      }
      throw new Error(`Failed to upsert category: ${error.message}`);
    }
  }

  /**
   * Delete category by ID
   * @param {number} id - Category ID
   * @returns {Promise<void>}
   */
  async deleteCategory(id) {
    try {
      const exists = await this.categoryExists(id);
      if (!exists) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
      }

      const query = 'DELETE FROM categories WHERE id = ?';
      db.prepare(query).run(id);
    } catch (error) {
      // Preserve custom error properties
      if (error.statusCode) {
        throw error;
      }
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }
}

export default new CategoryService();
