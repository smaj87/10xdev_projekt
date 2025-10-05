/**
 * COMMON WEBPACK CONFIGURATION
 */
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import threadLoader from 'thread-loader';
import webpack from 'webpack';

import clientConfig from './clientConfig/index.mjs';
import TranslationKeysOptimizerWebpackPlugin from './plugins/translation-keys-optimizer.mjs';
import resolve from './resolver.mjs';

const threadLoaderOptions = {
  workers: 4,
};
threadLoader.warmup(threadLoaderOptions, ['babel-loader']);

export default (options) => ({
  mode: options.mode,
  entry: options.entry,
  output: {
    path: path.resolve(process.cwd(), 'build'),
    publicPath: '/',
    clean: true,
    ...options.output,
  }, // Merge with env dependent settings
  optimization: options.optimization,
  module: {
    rules: [
      {
        test: /\.(m?jsx?|tsx?)$/, // Transform all .js, .mjs, .jsx, .ts, .tsx files required somewhere with Babel
        exclude: /node_modules/,
        use: [
          {
            loader: 'thread-loader',
            options: threadLoaderOptions,
          },
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              configFile: path.resolve(process.cwd(), 'babel.config.mjs'),
            },
          },
        ],
        type: 'javascript/auto', // Traktuj wszystkie pliki jako zwykły JS, nie native ES module
      },
      {
        // Preprocess 3rd party .css files located in node_modules
        test: /\.css$/,
        include: /node_modules/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(eot|otf|ttf|woff|woff2)$/,
        type: 'asset/resource',
        generator: {
          filename: '[hash][ext]',
        },
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-url-loader',
            options: {
              // Inline files smaller than 8 kB
              limit: 8 * 1024,
              noquotes: true,
            },
          },
        ],
      },
      {
        test: /\.(jpg|png|gif|webp)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              // Inline files smaller than 2 kB
              limit: 2 * 1024,
              noquotes: true,
            },
          },
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                enabled: false,
                // NOTE: mozjpeg is disabled as it causes errors in some Linux environments
                // Try enabling it in your environment by switching the config to:
                // enabled: true,
                // progressive: true,
              },
              gifsicle: {
                interlaced: false,
              },
              optipng: {
                optimizationLevel: 7,
              },
              pngquant: {
                quality: [0.65, 0.9],
                speed: 4,
              },
            },
          },
        ],
      },
      {
        test: /\.html$/,
        use: 'html-loader',
      },
      {
        test: /\.(mp4|webm)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
          },
        },
      },
    ],
  },
  plugins: options.plugins.concat([
    new TranslationKeysOptimizerWebpackPlugin({
      substringsToRemove: [],
      filesWithTranslations: [
        path.join(process.cwd(), 'app/components/translations/langs/pl.tsx'),
      ],
    }),

    // Always expose NODE_ENV to webpack, in order to use `process.env.NODE_ENV`
    // inside your code for any environment checks; Terser will automatically
    // drop any unreachable code.
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
      IS_START_PROD: false,
      ...clientConfig.default.config,
    }),
  ]),
  resolve,
  devtool: options.devtool,
  target: 'web', // Make web variables accessible to webpack, e.g. window
  performance: options.performance || {},
});
