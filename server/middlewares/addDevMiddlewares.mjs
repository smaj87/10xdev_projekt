/* eslint-disable no-console */
import { spawn } from 'child_process';
import killPort from 'kill-port';
import { createFsFromVolume, Volume } from 'memfs';
import path from 'path';
import util from 'util';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

const fs = createFsFromVolume(new Volume());
fs.join = path.join.bind(path);

const readFile = util.promisify(fs.readFile);

function createWebpackMiddleware(compiler, publicPath) {
  return webpackDevMiddleware(compiler, {
    publicPath,
    stats: 'errors-only',
    outputFileSystem: fs,
    headers: (req, res) => {
      const ext = path.extname(req.path);

      switch (ext) {
        case '.woff':
          res.setHeader('Cache-Control', 'max-age=604800, public');
          res.setHeader('Content-Type', 'font/woff');
          break;
        default:
      }
    },
  });
}

export default function addDevMiddlewares(app, webpackConfig) {
  const compiler = webpack(webpackConfig);
  const middleware = createWebpackMiddleware(
    compiler,
    webpackConfig.output.publicPath,
  );

  app.use(middleware);
  app.use(webpackHotMiddleware(compiler));

  // Listen for the 'done' event when the build is complete
  compiler.hooks.done.tap('BuildCompletePlugin', () => {
    if (process.argv[2] === 'initCypressTests') {
      const cypressCommand = `npx cypress run --env APP=${process.env.APP}`;

      const cypressProcess = spawn(cypressCommand, {
        shell: true, // Required for running npm scripts
        stdio: 'inherit', // Pipe the output to the parent terminal
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

  app.get('*', async (req, res) => {
    try {
      const file = await readFile(path.join(compiler.outputPath, 'index.html'));
      res.send(file.toString());
    } catch {
      res.sendStatus(404);
    }
  });
}
