import babelMinifyTemplateLiterals from './babel-plugins/babel-minify-literals/index.cjs';

export default (() => {
  const babelPlugins = [
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-proposal-class-properties',
    babelMinifyTemplateLiterals,
  ];

  return {
    assumptions: {
      setPublicClassFields: true,
    },
    sourceType: 'module',
    presets: [
      [
        '@babel/preset-env',
        {
          modules: false,
          debug: false,
          targets: {
            // UWAGA, babel ma bardzo slaba baze, wiele opcji dzilaa od chrome 80 a babel twierdzi ze 94
            chrome: '85',
            safari: '14',
          },
          exclude: [
            '@babel/plugin-proposal-optional-chaining', // chrome 80+
            '@babel/plugin-proposal-logical-assignment-operators', // chrome 85+
            '@babel/plugin-transform-parameters', // chrome 49+
            '@babel/plugin-proposal-object-rest-spread', // chrome 60+
            '@babel/plugin-transform-template-literals', // chrome 41+
            '@babel/plugin-transform-async-to-generator', // chrome 55+
            '@babel/plugin-transform-typeof-symbol', // chrome 73+
            '@babel/plugin-transform-classes', // chrome 49+ (no private/public fields and methods, no static blocks)
            '@babel/plugin-transform-arrow-functions', // chrome 45+
            '@babel/plugin-transform-unicode-regex', // chrome 50+, safari 10+
          ],
        },
      ],
      [
        '@babel/preset-react',
        {
          runtime: 'automatic',
          importSource: 'react',
        },
      ],
      ['@babel/preset-typescript'],
    ],
    plugins: babelPlugins,
    env: {
      production: {
        only: ['app'],
        plugins: ['transform-react-remove-prop-types'],
      },
    },
  };
})();
