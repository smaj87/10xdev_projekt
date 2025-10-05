import { apiPrefix } from '../config.mjs';
import { loadRoutes } from '../utils/routeLoader.mjs';

/**
 * API middleware for REST endpoints
 */
export default async (fastify) => {
  // Register API routes under configured API prefix
  await fastify.register(
    async (apiRoutes) => {
      // Global error handler for validation errors - applies to all API routes
      apiRoutes.setErrorHandler((error, request, reply) => {
        if (error.validation) {
          reply.status(400).send('Nieprawidłowe dane wejściowe');
        } else {
          reply.send(error);
        }
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
