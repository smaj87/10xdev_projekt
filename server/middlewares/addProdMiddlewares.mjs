import path from 'path';

import { dirVersion } from '../utils/version.mjs';

const indexFilePath = `${dirVersion}/index.html`;

export default async function addProdMiddlewares(fastify, options) {
  // Register compression plugin
  await fastify.register(import('@fastify/compress'), {
    global: true,
    threshold: 1024,
  });

  // Register static file serving with wildcard enabled (handles SPA routing)
  await fastify.register(import('@fastify/static'), {
    root: options.outputPath,
    prefix: options.publicPath,
    wildcard: true, // This handles the catch-all routing for SPA
    setHeaders: (reply, pathname) => {
      // Add cache headers for static assets
      if (pathname.endsWith('.woff') || pathname.endsWith('.woff2')) {
        reply.header('Cache-Control', 'max-age=604800, public');
      }
    },
  });

  // Add a specific route for index.html fallback if needed
  await fastify.setNotFoundHandler(async (request, reply) => {
    // For non-API routes, serve the index.html
    if (!request.url.startsWith('/api')) {
      return reply.sendFile(indexFilePath);
    }

    reply.code(404).send({ error: 'Not Found' });
  });
}
