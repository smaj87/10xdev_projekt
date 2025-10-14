/**
 * Admin Users API Routes
 * Endpoint: GET /api/admin/users
 * Purpose: List all users with filtering and pagination (admin only)
 */
import { authMiddleware } from '../middlewares/auth.middleware.mjs';
import { requireAdmin } from '../middlewares/requireAdmin.middleware.mjs';
import ErrorLogService from '../services/errorLog.service.mjs';
import UserService from '../services/user.service.mjs';

export default async (fastify) => {
  /**
   * GET /admin/users
   * List all users with optional filtering and pagination
   * Requires: Admin role
   */
  fastify.get(
    '/admin/users',
    {
      preHandler: [authMiddleware, requireAdmin],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'Filter by user role',
            },
            is_blocked: {
              type: 'boolean',
              description: 'Filter by blocked status',
            },
            page: {
              type: 'integer',
              minimum: 1,
              default: 1,
              description: 'Page number',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Records per page (max 100)',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    email: { type: 'string' },
                    role: { type: 'string', enum: ['user', 'admin'] },
                    is_blocked: { type: 'boolean' },
                    theme: {
                      type: 'string',
                      enum: ['light', 'dark', 'system'],
                      nullable: true,
                    },
                    created_at: { type: 'string' },
                    updated_at: { type: 'string' },
                  },
                },
              },
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      let statusCode = 200;
      let response = null;

      try {
        const { is_blocked, limit = 20, page = 1, role } = request.query;
        const { total, users } = await UserService.getAllUsers({
          role,
          is_blocked,
          page,
          limit,
        });
        const totalPages = Math.ceil(total / limit);

        statusCode = 200;
        response = {
          users,
          page,
          limit,
          total,
          totalPages,
        };
      } catch (error) {
        await ErrorLogService.logError({
          user_id: request.user?.id,
          endpoint: '/api/admin/users',
          method: 'GET',
          status_code: 500,
          error_message: error.message,
          request_data: JSON.stringify(request.query),
          response_data: null,
          user_agent: request.headers['user-agent'],
        });

        statusCode = 500;
        response = {
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An error occurred while retrieving users',
        };
      }

      return reply.status(statusCode).send(response);
    },
  );

  /**
   * Handle unsupported methods (405 Method Not Allowed)
   */
  const unsupportedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

  unsupportedMethods.forEach((method) => {
    fastify.route({
      method,
      url: '/admin/users',
      handler: async (request, reply) =>
        reply.status(405).send({
          statusCode: 405,
          error: 'Method Not Allowed',
          message: `${method} method is not supported for this endpoint`,
        }),
    });
  });
};
