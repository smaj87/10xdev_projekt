import crypto from 'crypto';
import HtmlWebpackPlugin from 'html-webpack-plugin';
// eslint-disable-next-line import/extensions
import { DuplicatesPlugin } from 'inspectpack/plugin/index.js';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import ejsLoader from 'template-ejs-loader';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import packageJson from '../package.json' with { type: 'json' };
import clientInfoLogger from '../server/utils/clientInfoLogger.mjs';
import templatePath from '../server/utils/templatePath.mjs';
import clientConfig from './clientConfig/index.mjs';
import webpackBaseBabel from './webpack.base.babel.mjs';

const packageVersion = packageJson.version.replace(/\.+/gi, '_');

const origin = 'TODO public host';
const publicPath =
  process.env.IS_START_LOCAL_PROD === 'true'
    ? 'http://localhost:3000/'
    : `${origin}/assets`;

const uniqueSourceMapsHash = crypto
  .createHash('md5')
  .update(Date.now().toString())
  .digest('hex')
  .substring(0, 10);

clientInfoLogger();

export default webpackBaseBabel({
  mode: 'production',

  // In production, we skip all hot-reloading stuff
  entry: [path.join(process.cwd(), 'app/app.mjs')],

  // Utilize long-term caching by adding content hashes (not compilation hashes) to compiled assets
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    publicPath,
    sourceMapFilename: `v${packageVersion}/maps_${uniqueSourceMapsHash}/[file].map`,
    clean: true,
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          mangle: {
            properties: {
              regex: /^_private_/,
            },
          },
        },
        extractComments: false,
        parallel: true,
      }),
    ],
    nodeEnv: 'production',
    sideEffects: true,
    concatenateModules: true,
    runtimeChunk: false,
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 10,
      minSize: 76800, // 75kB
      cacheGroups: {
        modules: {
          test: /[\\/]node_modules[\\/]/,
          priority: -9,
          name: 'npm',
        },
      },
    },
  },

  plugins: [
    new DuplicatesPlugin({
      // Emit compilation warning or error? (Default: `false`)
      emitErrors: false,
      // Handle all messages with handler function (`(report: string)`)
      // Overrides `emitErrors` output.
      emitHandler: undefined,
      // List of packages that can be ignored. (Default: `[]`)
      // - If a string, then a prefix match of `{$name}/` for each module.
      // - If a regex, then `.test(pattern)` which means you should add slashes
      //   where appropriate.
      //
      // **Note**: Uses posix paths for all matching (e.g., on windows `/` not `\`).
      ignoredPackages: undefined,
      // Display full duplicates information? (Default: `false`)
      verbose: false,
    }),

    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    }),

    // Minify and optimize the index.html
    new HtmlWebpackPlugin({
      template: ejsLoader.htmlWebpackPluginTemplateCustomizer({
        templatePath,
        htmlLoaderOption: {},
        templateEjsLoaderOption: {
          data: {
            ...clientConfig.default.templateData,
            IS_GTM: false,
            PUBLIC_PATH: publicPath,
            APP: process.env.APP,
          },
        },
      }),
      filename: `v${packageVersion}/index.html`,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
      inject: true,
    }),

    new webpack.ids.HashedModuleIdsPlugin({
      hashFunction: 'sha256',
      hashDigest: 'hex',
      hashDigestLength: 1,
    }),

    ...(process.env.IS_START_LOCAL_PROD === 'true'
      ? []
      : [new BundleAnalyzerPlugin()]),
  ],

  devtool: 'hidden-source-map',

  performance: {
    assetFilter: (assetFilename) =>
      !/(\.map$)|(^(main\.|favicon\.))/.test(assetFilename),
  },
});
