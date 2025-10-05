import { apiPrefix } from '../config.mjs';

/**
 * Creates a SPA routing handler for both dev and prod environments
 * Handles static file serving for non-API routes and proper 404 responses for API routes
 * @param {Function} serveIndexFn - Function that serves index.html file
 * @returns {Function} - Fastify not found handler for SPA routing
 */
export function createSpaRoutingHandler(serveIndexFn) {
  return async (request, reply) => {
    // For non-API routes, serve the index.html (SPA routing)
    if (!request.url.startsWith(apiPrefix)) {
      try {
        return await serveIndexFn(reply);
      } catch {
        return reply.code(404).send('Not Found');
      }
    } else {
      // API routes that don't exist
      return reply.code(404).send('API endpoint not found');
    }
  };
}

/**
 * Registers SPA routing for serving index.html on non-API routes
 * This is a more descriptive wrapper around fastify.setNotFoundHandler
 * @param {Object} fastify - Fastify instance
 * @param {Function} serveIndexFn - Function that serves index.html
 */
export function registerSpaRouting(fastify, serveIndexFn) {
  const spaHandler = createSpaRoutingHandler(serveIndexFn);
  fastify.setNotFoundHandler(spaHandler);
}
