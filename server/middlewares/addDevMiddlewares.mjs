/* eslint-disable no-console */
import { spawn } from 'child_process';
import killPort from 'kill-port';
import { createFsFromVolume, Volume } from 'memfs';
import path from 'path';
import util from 'util';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import { getHeadersForAsset } from '../utils/commonHeaders.mjs';

const fs = createFsFromVolume(new Volume());
fs.join = path.join.bind(path);

const readFile = util.promisify(fs.readFile);

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

  // Listen for the 'done' event when the build is complete
  compiler.hooks.done.tap('BuildCompletePlugin', () => {
    if (process.argv[2] === 'initCypressTests') {
      const cypressCommand = `npx cypress run --env APP=${process.env.APP}`;

      const cypressProcess = spawn(cypressCommand, {
        shell: true,
        stdio: 'inherit',
      });

      cypressProcess.on('close', (code) => {
        console.log(`Cypress tests completed with exit code ${code}`);

        killPort(3000, 'tcp')
          .then(() => {
            console.log('Process on port 3000 killed.');
          })
          .catch((err) => {
            console.error('Error killing process on port 3000:', err);
          });
      });
    }
  });

  // Catch-all route for dev server
  fastify.get('*', async (request, reply) => {
    try {
      const file = await readFile(path.join(compiler.outputPath, 'index.html'));
      reply.type('text/html').send(file.toString());
    } catch (error) {
      reply.code(404).send('Not Found');
    }
  });
}
