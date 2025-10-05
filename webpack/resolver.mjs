import path from 'path';

export default {
  modules: ['node_modules', 'app'],
  alias: {
    react: 'preact/compat',
    'react-dom': 'preact/compat', // Must be below test-utils
    'react-dom/client': 'preact/compat/client', // Must be below test-utils
    'react/jsx-runtime': 'preact/jsx-runtime',
    root: path.resolve(process.cwd(), './'),
    utils: path.resolve(process.cwd(), 'app/utils'),
    containers: path.resolve(process.cwd(), 'app/containers'),
    hoc: path.resolve(process.cwd(), 'app/containers/HOC'),
    components: path.resolve(process.cwd(), 'app/components'),
    commons: path.resolve(process.cwd(), 'app/commons'),
  },
  extensions: [
    `.${process.env.APP}.js`,
    `.${process.env.APP}.jsx`,
    `.${process.env.APP}.ts`,
    `.${process.env.APP}.tsx`,
    '.js',
    `.jsx`,
    `.ts`,
    `.tsx`,
  ],
  mainFields: ['browser', 'jsnext:main', 'main'],
};
