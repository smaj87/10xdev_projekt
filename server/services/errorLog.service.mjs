/**
 * Error Log Service
 * Handles error logging to database
 */
import db from '../db/database.mjs';

class ErrorLogService {
  /**
   * Log an error to the database
   * @param {Object} errorData - Error information
   * @param {number} [errorData.user_id] - User ID (optional)
   * @param {string} errorData.endpoint - API endpoint
   * @param {string} errorData.method - HTTP method
   * @param {number} errorData.status_code - HTTP status code
   * @param {string} errorData.error_message - Error message
   * @param {string} [errorData.request_data] - Request data (JSON string)
   * @param {string} [errorData.response_data] - Response data (JSON string)
   * @param {string} [errorData.user_agent] - User agent string
   * @returns {Promise<void>}
   */
  async logError({
    endpoint,
    error_message,
    method,
    request_data = null,
    response_data = null,
    status_code,
    user_agent = null,
    user_id = null,
  }) {
    try {
      const query = `
        INSERT INTO error_logs (
          user_id,
          endpoint,
          method,
          status_code,
          error_message,
          request_data,
          response_data,
          user_agent
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.prepare(query).run(
        user_id,
        endpoint,
        method,
        status_code,
        error_message,
        request_data,
        response_data,
        user_agent,
      );
    } catch (error) {
      // If logging fails, at least log to console
      console.error('Failed to log error to database:', error);
      console.error('Original error:', {
        user_id,
        endpoint,
        method,
        status_code,
        error_message,
      });
    }
  }
}

export default new ErrorLogService();
