import webpackConfig from '../../webpack/webpack.dev.babel.mjs';
import { isProd } from '../config.mjs';
import addDevMiddlewares from './addDevMiddlewares.mjs';
import addProdMiddlewares from './addProdMiddlewares.mjs';

/**
 * Front-end middleware for Fastify
 */
export default async (fastify, options) => {
  if (isProd) {
    // Production OR local production - serve static files from build folder
    await addProdMiddlewares(fastify, options);
  } else {
    // Development only - use webpack dev middleware
    await addDevMiddlewares(fastify, webpackConfig);
  }

  return fastify;
};
