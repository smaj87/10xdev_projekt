/**
 * Tasks API routes
 */
import { authMiddleware } from '../middlewares/auth.middleware.mjs';
import errorLogService from '../services/errorLog.service.mjs';
import taskService from '../services/task.service.mjs';
import { registerMethodNotAllowed } from '../utils/methodNotAllowed.mjs';

export default async (fastify) => {
  /**
   * PUT /api/lists/:listId/tasks
   * Create or update a task (upsert pattern)
   */
  fastify.put(
    '/api/lists/:listId/tasks',
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: 'object',
          required: ['listId'],
          properties: {
            listId: { type: 'integer', minimum: 1 },
          },
        },
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            taskId: { type: 'integer', minimum: 1 },
            title: { type: 'string', minLength: 1, maxLength: 500 },
            status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
            sort_order: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { listId } = request.params;
        const { sort_order, status, taskId, title } = request.body;
        const userId = request.user.id;

        // Upsert task (create if no taskId, update if taskId provided)
        const task = await taskService.upsertTask(listId, userId, {
          taskId,
          title,
          status,
          sort_order,
        });

        // Return 201 for create, 200 for update
        const statusCode = taskId ? 200 : 201;
        return reply.status(statusCode).send(task);
      } catch (error) {
        // Determine status code
        const statusCode = error.statusCode || 500;

        // Log error (exclude 401 for privacy)
        if (statusCode !== 401) {
          await errorLogService.logError({
            user_id: request.user?.id || null,
            endpoint: request.url,
            method: request.method,
            status_code: statusCode,
            error_message: error.message,
            request_data: JSON.stringify({
              params: request.params,
              body: request.body,
            }),
            user_agent: request.headers['user-agent'],
          });
        }

        // Send error response
        const errorMessage =
          process.env.NODE_ENV === 'production' && !error.statusCode
            ? 'An unexpected error occurred'
            : error.message;

        return reply.status(statusCode).send({
          statusCode,
          error: error.error || 'Error',
          message: errorMessage,
        });
      }
    },
  );

  /**
   * DELETE /api/tasks/:taskId
   * Delete a task
   */
  fastify.delete(
    '/api/tasks/:taskId',
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: 'object',
          required: ['taskId'],
          properties: {
            taskId: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { taskId } = request.params;
        const userId = request.user.id;

        await taskService.deleteTask(taskId, userId);

        return reply.status(204).send();
      } catch (error) {
        // Determine status code
        const statusCode = error.statusCode || 500;

        // Log error (exclude 401 for privacy)
        if (statusCode !== 401) {
          await errorLogService.logError({
            user_id: request.user?.id || null,
            endpoint: request.url,
            method: request.method,
            status_code: statusCode,
            error_message: error.message,
            request_data: JSON.stringify({
              params: request.params,
            }),
            user_agent: request.headers['user-agent'],
          });
        }

        // Send error response
        const errorMessage =
          process.env.NODE_ENV === 'production' && !error.statusCode
            ? 'An unexpected error occurred'
            : error.message;

        return reply.status(statusCode).send({
          statusCode,
          error: error.error || 'Error',
          message: errorMessage,
        });
      }
    },
  );

  /**
   * PUT /api/lists/:listId/tasks/reorder
   * Reorder tasks in a list
   */
  fastify.put(
    '/api/lists/:listId/tasks/reorder',
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: 'object',
          required: ['listId'],
          properties: {
            listId: { type: 'integer', minimum: 1 },
          },
        },
        body: {
          type: 'object',
          required: ['order'],
          properties: {
            order: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['id', 'position'],
                properties: {
                  id: { type: 'integer', minimum: 1 },
                  position: { type: 'integer', minimum: 0 },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { listId } = request.params;
        const { order } = request.body;
        const userId = request.user.id;

        const result = await taskService.reorderTasks(listId, userId, order);

        return reply.status(200).send(result);
      } catch (error) {
        // Determine status code
        const statusCode = error.statusCode || 500;

        // Log error (exclude 401 for privacy)
        if (statusCode !== 401) {
          await errorLogService.logError({
            user_id: request.user?.id || null,
            endpoint: request.url,
            method: request.method,
            status_code: statusCode,
            error_message: error.message,
            request_data: JSON.stringify({
              params: request.params,
              body: request.body,
            }),
            user_agent: request.headers['user-agent'],
          });
        }

        // Send error response
        const errorMessage =
          process.env.NODE_ENV === 'production' && !error.statusCode
            ? 'An unexpected error occurred'
            : error.message;

        return reply.status(statusCode).send({
          statusCode,
          error: error.error || 'Error',
          message: errorMessage,
        });
      }
    },
  );

  // Register Method Not Allowed handlers
  registerMethodNotAllowed(fastify, '/api/lists/:listId/tasks', [
    'GET',
    'POST',
    'PATCH',
    'DELETE',
  ]);

  registerMethodNotAllowed(fastify, '/api/tasks/:taskId', [
    'GET',
    'POST',
    'PUT',
    'PATCH',
  ]);

  registerMethodNotAllowed(fastify, '/api/lists/:listId/tasks/reorder', [
    'GET',
    'POST',
    'PATCH',
    'DELETE',
  ]);
};
