/**
 * Admin Authorization Middleware
 * Verifies that authenticated user has admin role
 */
import ErrorLogService from '../services/errorLog.service.mjs';

/**
 * Admin authorization middleware for Fastify
 * Must be used after authMiddleware
 * Checks if user has admin role
 */
export async function requireAdmin(request, reply) {
  try {
    // Check if user is attached (should be done by authMiddleware)
    if (!request.user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Check if user has admin role
    if (request.user.role !== 'admin') {
      // Log unauthorized access attempt
      await ErrorLogService.logError({
        user_id: request.user.id,
        endpoint: request.url,
        method: request.method,
        status_code: 403,
        error_message: 'Attempted access to admin endpoint without admin role',
        request_data: JSON.stringify({
          query: request.query,
          params: request.params,
        }),
        response_data: null,
        user_agent: request.headers['user-agent'],
      });

      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Admin role required',
      });
    }
    // User is admin, continue
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Admin authorization error:', error);

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Authorization check failed',
    });
  }
}
