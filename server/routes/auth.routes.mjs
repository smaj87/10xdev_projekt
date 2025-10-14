/**
 * Authentication API Routes
 * Endpoints: POST /api/auth/login, GET /api/auth/logout
 */
import { authMiddleware } from '../middlewares/auth.middleware.mjs';
import ErrorLogService from '../services/errorLog.service.mjs';
import UserService from '../services/user.service.mjs';

export default async (fastify) => {
  /**
   * POST /auth/login
   * Authenticate user and create session
   */
  fastify.post(
    '/auth/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              minLength: 1,
              description: 'User password',
            },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  email: { type: 'string' },
                  role: { type: 'string', enum: ['user', 'admin'] },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      let statusCode = 200;
      let response = null;
      let shouldSetCookie = false;
      let sessionId = null;

      try {
        const { email, password } = request.body;
        const user = await UserService.getUserByEmailAndPassword(
          email,
          password,
        );

        if (!user) {
          statusCode = 461;
          response = {
            statusCode: 461,
            error: 'Unauthorized',
            message: 'Invalid email or password',
          };
        } else if (user.is_blocked) {
          await ErrorLogService.logError({
            userId: user.id,
            endpoint: '/auth/login',
            method: 'POST',
            statusCode: 463,
            errorMessage: 'Login attempt on blocked account',
            requestData: JSON.stringify({ email }),
            userAgent: request.headers['user-agent'],
          });

          statusCode = 463;
          response = {
            statusCode: 463,
            error: 'Forbidden',
            message: 'Account is blocked',
          };
        } else {
          sessionId = await UserService.createSession(user.id);
          shouldSetCookie = true;
          statusCode = 200;
          response = {
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
            },
          };
        }
      } catch (error) {
        await ErrorLogService.logError({
          userId: null,
          endpoint: '/auth/login',
          method: 'POST',
          statusCode: 500,
          errorMessage: error.message,
          requestData: JSON.stringify({ email: request.body.email }),
          userAgent: request.headers['user-agent'],
        });

        statusCode = 500;
        response = {
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Authentication failed',
        };
      }

      if (shouldSetCookie && sessionId) {
        const isProduction = process.env.NODE_ENV === 'production';

        reply.setCookie('sessionId', sessionId, {
          httpOnly: true,
          path: '/',
          sameSite: 'strict',
          maxAge: 604800,
          secure: isProduction,
        });
      }

      return reply.status(statusCode).send(response);
    },
  );

  /**
   * GET /auth/logout
   * Logout user and destroy session
   */
  fastify.get(
    '/auth/logout',
    {
      preHandler: authMiddleware,
    },
    async (request, reply) => {
      let statusCode = 204;
      let response = null;
      let shouldClearCookie = false;

      try {
        const sessionId = request.cookies?.sessionId;

        if (!sessionId) {
          statusCode = 409;
          response = {
            statusCode: 409,
            error: 'Unauthorized',
            message: 'Authentication required',
          };
        } else {
          await UserService.deleteSession(sessionId);
          shouldClearCookie = true;
          statusCode = 204;
        }
      } catch (error) {
        await ErrorLogService.logError({
          userId: request.user?.id || null,
          endpoint: '/auth/logout',
          method: 'GET',
          statusCode: 500,
          errorMessage: error.message,
          requestData: null,
          userAgent: request.headers['user-agent'],
        });

        statusCode = 500;
        response = {
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Logout failed',
        };
      }

      if (shouldClearCookie) {
        reply.clearCookie('sessionId', { path: '/' });
      }

      if (response) {
        return reply.status(statusCode).send(response);
      }

      return reply.status(statusCode).send();
    },
  );

  /**
   * Fallback for unsupported methods on /auth/login
   */
  fastify.all('/auth/login', async (request, reply) => {
    if (request.method !== 'POST') {
      return reply.status(405).send({
        statusCode: 405,
        error: 'Method Not Allowed',
        message: `Method ${request.method} not allowed for this endpoint`,
      });
    }

    return undefined;
  });

  /**
   * Fallback for unsupported methods on /auth/logout
   */
  fastify.all('/auth/logout', async (request, reply) => {
    if (request.method !== 'GET') {
      return reply.status(405).send({
        statusCode: 405,
        error: 'Method Not Allowed',
        message: `Method ${request.method} not allowed for this endpoint`,
      });
    }

    return undefined;
  });
};
