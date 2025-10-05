import { createFsFromVolume, Volume } from 'memfs';
import path from 'path';
import util from 'util';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import { getHeadersForAsset } from '../utils/commonHeaders.mjs';
import { registerSpaRouting } from '../utils/spaRoutingHandler.mjs';

const fs = createFsFromVolume(new Volume());
fs.join = path.join.bind(path);

function createWebpackMiddleware(compiler, publicPath) {
  return webpackDevMiddleware(compiler, {
    publicPath,
    stats: 'errors-only',
    outputFileSystem: fs,
    headers: (req, res) => {
      const headers = getHeadersForAsset(req);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    },
  });
}

export default async function addDevMiddlewares(fastify, webpackConfig) {
  const compiler = webpack(webpackConfig);
  const middleware = createWebpackMiddleware(
    compiler,
    webpackConfig.output.publicPath,
  );

  // Register @fastify/middie to support Express-style middleware
  await fastify.register(import('@fastify/middie'));

  // Use webpack dev middleware
  fastify.use(middleware);
  fastify.use(webpackHotMiddleware(compiler));

  // Register SPA routing for dev server - exclude API routes
  registerSpaRouting(fastify, async (reply) => {
    const readFile = util.promisify(fs.readFile);
    const file = await readFile(path.join(compiler.outputPath, 'index.html'));
    return reply.type('text/html').send(file.toString());
  });
}
