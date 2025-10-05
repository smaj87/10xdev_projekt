if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
  // require('preact/debug');
}

// double effects call
// eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
const { options } = require('preact');

options.debounceRendering = Promise.prototype.then.bind(Promise.resolve());
options.requestAnimationFrame = Promise.prototype.then.bind(Promise.resolve());
