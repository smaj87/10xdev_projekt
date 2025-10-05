/* eslint consistent-return:0 import/order:0 */

import Fastify from 'fastify';
import { resolve } from 'path';

import { buildPath, host, isProd, port, prettyHost } from './config.mjs';
import logger from './logger.mjs';
import apiSetup from './middlewares/apiMiddleware.mjs';
import setup from './middlewares/frontendMiddleware.mjs';

async function startServer() {
  // Create Fastify instance without logger to disable default "Server listening at" messages
  // If you want to enable Fastify logging, change `false` to logger configuration object below:
  /*
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
  */
  const fastify = Fastify({
    logger: false, // Disabled Fastify logger - change to logger config object if you want to enable it
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

  // Setup API middleware BEFORE frontend middleware to avoid route conflicts
  await apiSetup(fastify);

  // Setup frontend middleware
  await setup(fastify, {
    outputPath: resolve(process.cwd(), buildPath),
    publicPath: '/',
  });

  // Handle gzipped JS files - only for development and local production
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
