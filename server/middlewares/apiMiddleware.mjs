import { apiPrefix } from '../config.mjs';
import ErrorLogService from '../services/errorLog.service.mjs';
import { loadRoutes } from '../utils/routeLoader.mjs';

/**
 * API middleware for REST endpoints
 */
export default async (fastify) => {
  // Register API routes under configured API prefix
  await fastify.register(
    async (apiRoutes) => {
      // Global error handler for validation errors - applies to all API routes
      apiRoutes.setErrorHandler(async (error, request, reply) => {
        // Validation errors (400)
        if (error.validation) {
          const statusCode = 400;
          const errorMessage = error.message || 'Invalid input data';

          // Log validation errors
          await ErrorLogService.logError({
            user_id: request.user?.id || null,
            endpoint: request.url,
            method: request.method,
            status_code: statusCode,
            error_message: errorMessage,
            request_data: JSON.stringify({
              query: request.query,
              params: request.params,
              body: request.body,
            }),
            response_data: null,
            user_agent: request.headers['user-agent'],
          });

          return reply.status(statusCode).send({
            statusCode,
            error: 'Bad Request',
            message: errorMessage,
            details: error.validation,
          });
        }

        // Other errors (500)
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || 'Internal Server Error';

        // Log all 5xx errors
        if (statusCode >= 500) {
          // eslint-disable-next-line no-console
          console.error('API Error:', error);

          await ErrorLogService.logError({
            user_id: request.user?.id || null,
            endpoint: request.url,
            method: request.method,
            status_code: statusCode,
            error_message: errorMessage,
            request_data: JSON.stringify({
              query: request.query,
              params: request.params,
              body: request.body,
            }),
            response_data: null,
            user_agent: request.headers['user-agent'],
          });
        }

        return reply.status(statusCode).send({
          statusCode,
          error: statusCode >= 500 ? 'Internal Server Error' : 'Error',
          message:
            statusCode >= 500 ? 'An unexpected error occurred' : errorMessage,
        });
      });

      // Status endpoint - returns 200 OK for all HTTP methods
      apiRoutes.all('/', async (request, reply) => {
        reply.status(200).send('STATUS OK');
      });

      // Automatically load all route files from routes directory
      await loadRoutes(apiRoutes);
    },
    { prefix: apiPrefix },
  );

  return fastify;
};
