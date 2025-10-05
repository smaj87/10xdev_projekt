/* eslint-disable global-require */

import webpackConfig from '../../webpack/webpack.dev.babel.mjs';
import addDevMiddlewares from './addDevMiddlewares.mjs';
import addProdMiddlewares from './addProdMiddlewares.mjs';

/**
 * Front-end middleware
 */
export default (app, options) => {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    addProdMiddlewares(app, options);
  } else {
    addDevMiddlewares(app, webpackConfig);
  }

  return app;
};
