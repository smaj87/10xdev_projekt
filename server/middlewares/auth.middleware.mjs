/**
 * Authentication Middleware
 * Verifies user session and attaches user data to request
 */
import UserService from '../services/user.service.mjs';

/**
 * Authentication middleware for Fastify
 * Checks for valid session and loads user data
 */
export async function authMiddleware(request, reply) {
  let statusCode = 200;
  let response = null;

  try {
    const sessionId = request.cookies?.sessionId;

    if (!sessionId) {
      statusCode = 401;
      response = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
      };
    } else {
      const user = await UserService.getUserBySession(sessionId);

      if (!user) {
        statusCode = 401;
        response = {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid or expired session',
        };
      } else if (user.is_blocked) {
        statusCode = 403;
        response = {
          statusCode: 403,
          error: 'Forbidden',
          message: 'Account is blocked',
        };
      } else {
        request.user = user;
      }
    }
  } catch {
    statusCode = 500;
    response = {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Authentication failed',
    };
  }

  if (response) {
    return reply.status(statusCode).send(response);
  }

  return undefined;
}
