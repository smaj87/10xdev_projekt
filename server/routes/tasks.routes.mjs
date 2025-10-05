/**
 * Tasks API routes
 */
export default async (fastify) => {
  // GET /tasks - returns empty array
  fastify.get('/tasks', async (request, reply) => {
    reply.send([]);
  });

  // GET /tasks/:id - returns empty object for now
  fastify.get(
    '/tasks/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'integer', minimum: 1 },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      reply.send({ id });
    },
  );
};
