/**
 * Admin Users API Routes
 * Endpoint: GET /api/admin/users, PUT /api/admin/users/:userId, DELETE /api/admin/users/:userId
 * Purpose: List and manage users (admin only)
 */
import { authMiddleware } from '../middlewares/auth.middleware.mjs';
import { requireAdmin } from '../middlewares/requireAdmin.middleware.mjs';
import ErrorLogService from '../services/errorLog.service.mjs';
import UserService from '../services/user.service.mjs';
import { registerMethodNotAllowed } from '../utils/methodNotAllowed.mjs';

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
   * PUT /admin/users/:userId
   * Create or update user (admin only)
   * Requires: Admin role
   */
  fastify.put(
    '/admin/users/:userId',
    {
      preHandler: [authMiddleware, requireAdmin],
      schema: {
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: {
              type: 'integer',
              minimum: 1,
              description: 'User ID',
            },
          },
        },
        body: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role',
            },
            is_blocked: {
              type: 'boolean',
              description: 'Block status',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address (must be unique)',
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Password (minimum 8 characters)',
            },
            theme: {
              type: 'string',
              enum: ['light', 'dark', 'system'],
              description: 'Interface theme',
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
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
      },
    },
    async (request, reply) => {
      let statusCode = 200;
      let response = null;

      try {
        const { userId } = request.params;
        const { email, is_blocked, password, role, theme } = request.body;

        // Validate that at least one field is provided
        if (
          role === undefined &&
          is_blocked === undefined &&
          !email &&
          !password &&
          theme === undefined
        ) {
          statusCode = 400;
          response = {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Validation error: at least one field must be provided',
          };

          await ErrorLogService.logError({
            user_id: request.user?.id,
            endpoint: `/api/admin/users/${userId}`,
            method: 'PUT',
            status_code: 400,
            error_message: 'At least one field must be provided',
            request_data: JSON.stringify({
              params: request.params,
              body: request.body,
            }),
            response_data: JSON.stringify(response),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(statusCode).send(response);
        }

        // Check if user exists
        const existingUser = await UserService.getUserById(userId);

        if (existingUser) {
          // UPDATE MODE

          // Validate email uniqueness if email is being changed
          if (email && (await UserService.emailExists(email, userId))) {
            statusCode = 400;
            response = {
              statusCode: 400,
              error: 'Bad Request',
              message: 'Validation error: email already exists',
            };

            await ErrorLogService.logError({
              user_id: request.user?.id,
              endpoint: `/api/admin/users/${userId}`,
              method: 'PUT',
              status_code: 400,
              error_message: 'Email already exists',
              request_data: JSON.stringify({
                params: request.params,
                body: request.body,
              }),
              response_data: JSON.stringify(response),
              user_agent: request.headers['user-agent'],
            });

            return reply.status(statusCode).send(response);
          }

          // Prepare update data
          const updateData = {};
          if (role !== undefined) {
            updateData.role = role;
          }
          if (is_blocked !== undefined) {
            updateData.is_blocked = is_blocked;
          }
          if (email !== undefined) {
            updateData.email = email;
          }
          if (theme !== undefined) {
            updateData.theme = theme;
          }

          // Hash password if provided
          if (password) {
            updateData.password_hash = await UserService.hashPassword(password);
          }

          // Update user
          const updatedUser = await UserService.updateUser(userId, updateData);

          statusCode = 200;
          response = updatedUser;
        } else {
          // CREATE MODE

          // Validate required fields for creating new user
          if (!email || !password) {
            statusCode = 400;
            response = {
              statusCode: 400,
              error: 'Bad Request',
              message:
                'Validation error: email and password are required for new user',
            };

            await ErrorLogService.logError({
              user_id: request.user?.id,
              endpoint: `/api/admin/users/${userId}`,
              method: 'PUT',
              status_code: 400,
              error_message: 'Email and password required for new user',
              request_data: JSON.stringify({
                params: request.params,
                body: request.body,
              }),
              response_data: JSON.stringify(response),
              user_agent: request.headers['user-agent'],
            });

            return reply.status(statusCode).send(response);
          }

          // Validate email uniqueness
          if (await UserService.emailExists(email)) {
            statusCode = 400;
            response = {
              statusCode: 400,
              error: 'Bad Request',
              message: 'Validation error: email already exists',
            };

            await ErrorLogService.logError({
              user_id: request.user?.id,
              endpoint: `/api/admin/users/${userId}`,
              method: 'PUT',
              status_code: 400,
              error_message: 'Email already exists',
              request_data: JSON.stringify({
                params: request.params,
                body: request.body,
              }),
              response_data: JSON.stringify(response),
              user_agent: request.headers['user-agent'],
            });

            return reply.status(statusCode).send(response);
          }

          // Hash password
          const password_hash = await UserService.hashPassword(password);

          // Create user
          const createdUser = await UserService.createUser(userId, {
            email,
            password_hash,
            role: role || 'user',
            is_blocked: is_blocked !== undefined ? is_blocked : false,
            theme: theme || null,
          });

          statusCode = 200;
          response = createdUser;
        }
      } catch (error) {
        await ErrorLogService.logError({
          user_id: request.user?.id,
          endpoint: `/api/admin/users/${request.params.userId}`,
          method: 'PUT',
          status_code: 500,
          error_message: error.message,
          request_data: JSON.stringify({
            params: request.params,
            body: request.body,
          }),
          response_data: null,
          user_agent: request.headers['user-agent'],
        });

        statusCode = 500;
        response = {
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to update user',
        };
      }

      return reply.status(statusCode).send(response);
    },
  );

  /**
   * DELETE /admin/users/:userId
   * Delete user (admin only)
   * Requires: Admin role
   */
  fastify.delete(
    '/admin/users/:userId',
    {
      preHandler: [authMiddleware, requireAdmin],
      schema: {
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: {
              type: 'integer',
              minimum: 1,
              description: 'User ID',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              userId: { type: 'integer' },
            },
          },
          404: {
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      let statusCode = 200;
      let response = null;

      try {
        const { userId } = request.params;

        // Check if user exists
        const existingUser = await UserService.getUserById(userId);

        if (!existingUser) {
          statusCode = 404;
          response = {
            statusCode: 404,
            error: 'Not Found',
            message: `User with ID ${userId} not found`,
          };

          await ErrorLogService.logError({
            user_id: request.user?.id,
            endpoint: `/api/admin/users/${userId}`,
            method: 'DELETE',
            status_code: 404,
            error_message: 'User not found',
            request_data: JSON.stringify({ params: request.params }),
            response_data: JSON.stringify(response),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(statusCode).send(response);
        }

        // Prevent self-deletion
        if (request.user.id === userId) {
          statusCode = 400;
          response = {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Cannot delete your own account',
          };

          await ErrorLogService.logError({
            user_id: request.user?.id,
            endpoint: `/api/admin/users/${userId}`,
            method: 'DELETE',
            status_code: 400,
            error_message: 'Attempted self-deletion',
            request_data: JSON.stringify({ params: request.params }),
            response_data: JSON.stringify(response),
            user_agent: request.headers['user-agent'],
          });

          return reply.status(statusCode).send(response);
        }

        // Delete user
        const deleted = await UserService.deleteUser(userId);

        if (deleted) {
          statusCode = 200;
          response = {
            message: 'User deleted successfully',
            userId,
          };
        } else {
          statusCode = 500;
          response = {
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Failed to delete user',
          };
        }
      } catch (error) {
        await ErrorLogService.logError({
          user_id: request.user?.id,
          endpoint: `/api/admin/users/${request.params.userId}`,
          method: 'DELETE',
          status_code: 500,
          error_message: error.message,
          request_data: JSON.stringify({ params: request.params }),
          response_data: null,
          user_agent: request.headers['user-agent'],
        });

        statusCode = 500;
        response = {
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to delete user',
        };
      }

      return reply.status(statusCode).send(response);
    },
  );

  /**
   * Method Not Allowed handlers for /admin/users (all except GET)
   */
  registerMethodNotAllowed(fastify, '/admin/users', [
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
  ]);

  /**
   * Method Not Allowed handlers for /admin/users/:userId (all except PUT and DELETE)
   */
  registerMethodNotAllowed(fastify, '/admin/users/:userId', [
    'GET',
    'POST',
    'PATCH',
  ]);
};
