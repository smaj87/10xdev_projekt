/**
 * List API routes
 */
export default async (fastify) => {
  fastify.get('/list', async (request, reply) => {
    reply.send([]);
  });
};
