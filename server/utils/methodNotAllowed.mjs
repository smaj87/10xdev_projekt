/**
 * Utility function to register Method Not Allowed (405) handlers
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {string} url - Route URL
 * @param {string[]} unsupportedMethods - Array of HTTP methods to block (e.g., ['GET', 'POST'])
 */
export function registerMethodNotAllowed(fastify, url, unsupportedMethods) {
  unsupportedMethods.forEach((method) => {
    fastify.route({
      method,
      url,
      handler: async (request, reply) =>
        reply.status(405).send({
          statusCode: 405,
          error: 'Method Not Allowed',
          message: `Method ${request.method} is not allowed for this endpoint`,
        }),
    });
  });
}
