import compression from 'compression';
import express from 'express';
import path from 'path';

import packageJson from '../../package.json' with { type: 'json' };

const packageVersion = packageJson.version.replace(/\.+/gi, '_');
const indexFilePath = `v${packageVersion}/index.html`;

export default function addProdMiddlewares(app, options) {
  const publicPath = options.publicPath || '/';
  const outputPath = options.outputPath || path.resolve(process.cwd(), 'build');

  // compression middleware compresses your server responses which makes them
  // smaller (applies also to assets). You can read more about that technique
  // and other good practices on official Express.js docs http://mxs.is/googmy
  app.use(compression());
  app.use(publicPath, express.static(outputPath));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(outputPath, indexFilePath)),
  );
}
