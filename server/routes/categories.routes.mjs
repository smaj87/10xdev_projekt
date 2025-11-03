/**
 * Categories API routes
 * Handles category management operations
 */
import { authMiddleware } from '../middlewares/auth.middleware.mjs';
import { requireAdmin } from '../middlewares/requireAdmin.middleware.mjs';
import CategoryService from '../services/category.service.mjs';
import ErrorLogService from '../services/errorLog.service.mjs';
import { registerMethodNotAllowed } from '../utils/methodNotAllowed.mjs';

// Validation schemas
const upsertCategorySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
  },
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
      },
      color: {
        type: 'string',
        pattern: '^#[0-9A-Fa-f]{6}$',
      },
    },
    additionalProperties: false,
  },
};

const deleteCategorySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 },
    },
  },
};

export default async function (fastify) {
  /**
   * GET /categories
   * Get all categories (public access)
   */
  fastify.get('/categories', async (request, reply) => {
    try {
      const categories = await CategoryService.getAllCategories();

      return reply.status(200).send(categories);
    } catch (error) {
      // Log server errors
      await ErrorLogService.logError({
        user_id: request.user?.id || null,
        endpoint: request.url,
        method: request.method,
        status_code: 500,
        error_message: error.message,
        request_data: null,
        response_data: null,
        user_agent: request.headers['user-agent'],
      });

      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to fetch categories',
      });
    }
  });

  /**
   * PUT /categories/:id
   * Create or update category (admin only)
   */
  fastify.put(
    '/categories/:id',
    {
      preHandler: [authMiddleware, requireAdmin],
      schema: upsertCategorySchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { color, name } = request.body;

        // Call upsert service
        const { category, isNew } = await CategoryService.upsertCategory(id, {
          name,
          color,
        });

        // Return 201 for create, 200 for update
        const statusCode = isNew ? 201 : 200;
        return reply.status(statusCode).send(category);
      } catch (error) {
        // Determine status code
        const statusCode = error.statusCode || 500;

        // Log errors 403 and 5xx
        if (statusCode >= 500 || statusCode === 403) {
          await ErrorLogService.logError({
            user_id: request.user?.id || null,
            endpoint: request.url,
            method: request.method,
            status_code: statusCode,
            error_message: error.message,
            request_data: JSON.stringify({
              params: request.params,
              body: request.body,
            }),
            response_data: null,
            user_agent: request.headers['user-agent'],
          });
        }

        // Return appropriate error response
        let errorType = 'Internal Server Error';
        if (statusCode === 400) {
          errorType = 'Bad Request';
        } else if (statusCode === 409) {
          errorType = 'Conflict';
        }

        return reply.status(statusCode).send({
          statusCode,
          error: errorType,
          message: error.message,
        });
      }
    },
  );

  /**
   * DELETE /categories/:id
   * Delete category (admin only)
   */
  fastify.delete(
    '/categories/:id',
    {
      preHandler: [authMiddleware, requireAdmin],
      schema: deleteCategorySchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params;

        await CategoryService.deleteCategory(id);

        return reply.status(204).send();
      } catch (error) {
        // Determine status code
        const statusCode = error.statusCode || 500;

        // Log errors 403 and 5xx
        if (statusCode >= 500 || statusCode === 403) {
          await ErrorLogService.logError({
            user_id: request.user?.id || null,
            endpoint: request.url,
            method: request.method,
            status_code: statusCode,
            error_message: error.message,
            request_data: JSON.stringify({
              params: request.params,
            }),
            response_data: null,
            user_agent: request.headers['user-agent'],
          });
        }

        // Return appropriate error response
        return reply.status(statusCode).send({
          statusCode,
          error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
          message: error.message,
        });
      }
    },
  );

  /**
   * Method Not Allowed handlers for /categories (all except GET)
   */
  registerMethodNotAllowed(fastify, '/categories', [
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
  ]);

  /**
   * Method Not Allowed handlers for /categories/:id (all except PUT and DELETE)
   */
  registerMethodNotAllowed(fastify, '/categories/:id', [
    'GET',
    'POST',
    'PATCH',
  ]);
}
