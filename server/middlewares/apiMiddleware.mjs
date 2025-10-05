import { apiPrefix } from '../config.mjs';

/**
 * API middleware for REST endpoints
 */
export default async (fastify) => {
  // Register API routes under configured API prefix
  await fastify.register(
    async (apiRoutes) => {
      // Status endpoint - returns 200 OK for all HTTP methods
      apiRoutes.all('/', async (request, reply) => {
        reply.status(200).send('STATUS OK');
      });

      // GET /api/tasks - returns empty array
      apiRoutes.get('/tasks', async (request, reply) => {
        reply.send([]);
      });

      // GET /api/tasks/:id - returns empty object for now
      apiRoutes.get('/tasks/:id', async (request, reply) => {
        const { id } = request.params;
        reply.send({ id });
      });
    },
    { prefix: apiPrefix },
  );

  return fastify;
};
