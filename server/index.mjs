/* eslint consistent-return:0 import/order:0 */

import Fastify from 'fastify';
import { resolve } from 'path';

import { host, port, prettyHost } from './config.mjs';
import logger from './logger.mjs';
import setup from './middlewares/frontendMiddleware.mjs';

async function startServer() {
  // Create Fastify instance with logger
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    },
  });

  // Register graceful shutdown
  process.on('SIGINT', () => {
    fastify
      .close()
      .then(() => {
        logger.appStopped();
        process.exit(0);
      })
      .catch((err) => {
        logger.error(err);
        process.exit(1);
      });
  });

  // Determine correct build path based on environment
  const isProd = process.env.NODE_ENV === 'production';
  const buildPath = isProd ? 'build' : 'build_dev';

  // Setup frontend middleware
  await setup(fastify, {
    outputPath: resolve(process.cwd(), buildPath),
    publicPath: '/',
  });

  // Handle gzipped JS files - only for development
  if (!isProd) {
    fastify.addHook('onRequest', async (request, reply) => {
      if (request.url.endsWith('.js') && !request.url.endsWith('.js.gz')) {
        const gzUrl = `${request.url}.gz`;
        request.url = gzUrl;
        reply.header('Content-Encoding', 'gzip');
        reply.header('Content-Type', 'application/javascript');
      }
    });
  }

  // Start server
  try {
    await fastify.listen({
      port,
      host: host || '0.0.0.0',
    });

    logger.appStarted(port, prettyHost);
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }
}

startServer();
