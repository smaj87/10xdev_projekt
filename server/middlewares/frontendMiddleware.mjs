/* eslint-disable global-require */

import webpackConfig from '../../webpack/webpack.dev.babel.mjs';
import addDevMiddlewares from './addDevMiddlewares.mjs';
import addProdMiddlewares from './addProdMiddlewares.mjs';

/**
 * Front-end middleware for Fastify
 */
export default async (fastify, options) => {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    await addProdMiddlewares(fastify, options);
  } else {
    await addDevMiddlewares(fastify, webpackConfig);
  }

  return fastify;
};
