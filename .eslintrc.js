// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const prettierOptions = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '.prettierrc'), 'utf8'),
);

module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'airbnb',
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'plugin:cypress/recommended',
  ],
  plugins: [
    'prettier',
    'react',
    'react-hooks',
    'redux-saga',
    'jsx-a11y',
    '@typescript-eslint',
    'simple-import-sort',
    'sort-destructure-keys',
  ],
  env: {
    jest: true,
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'prettier/prettier': [2, prettierOptions],
    curly: ['error', 'all'],
    'arrow-body-style': [2, 'as-needed'],
    'arrow-parens': 2,
    'arrow-spacing': 2,
    'no-lonely-if': 2,
    'class-methods-use-this': 0,
    'comma-dangle': [2, 'always-multiline'],
    indent: 0,
    'max-len': 0,
    'newline-per-chained-call': 0,
    'no-confusing-arrow': 0,
    'no-console': 2,
    'no-use-before-define': 0,
    'prefer-template': 2,
    'require-yield': 0,
    'no-underscore-dangle': 0,
    'no-plusplus': 0,
    'default-param-last': 0,
    'no-unused-vars': 0,
    'no-shadow': 0,
    'no-restricted-globals': 0,
    'no-empty': [2, { allowEmptyCatch: true }],
    'jsx-quotes': [2, 'prefer-double'],
    'linebreak-style': [2, 'unix'],

    'sort-destructure-keys/sort-destructure-keys': 2,

    'import/imports-first': 0,
    'import/newline-after-import': 2,
    'import/no-dynamic-require': 0,
    'import/no-extraneous-dependencies': 0,
    'import/no-named-as-default': 0,
    'import/no-unresolved': 2,
    'import/no-webpack-loader-syntax': 0,
    'import/prefer-default-export': 0,

    'jsx-a11y/aria-props': 2,
    'jsx-a11y/heading-has-content': 0,
    'jsx-a11y/label-has-associated-control': [
      2,
      {
        // NOTE: If this error triggers, either disable it or add
        // your custom components, labels and attributes via these options
        // See https://github.com/evcohen/eslint-plugin-jsx-a11y/blob/master/docs/rules/label-has-associated-control.md
        controlComponents: ['Input'],
      },
    ],
    'jsx-a11y/label-has-for': 0,
    'jsx-a11y/mouse-events-have-key-events': 2,
    'jsx-a11y/role-has-required-aria-props': 2,
    'jsx-a11y/role-supports-aria-props': 2,
    'jsx-a11y/click-events-have-key-events': 1,
    'jsx-a11y/no-noninteractive-element-interactions': 1,

    'react/destructuring-assignment': 0,
    'react/function-component-definition': [
      2,
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'react-hooks/rules-of-hooks': 2,
    'react/jsx-closing-tag-location': 0,
    'react/forbid-prop-types': 0,
    'react/jsx-first-prop-new-line': [2, 'multiline'],
    'react/jsx-filename-extension': 0,
    'react/jsx-no-target-blank': 0,
    'react/jsx-uses-vars': 2,
    'react/require-default-props': 0,
    'react/require-extension': 0,
    'react/self-closing-comp': 0,
    'react/sort-comp': 0,
    'react/jsx-props-no-spreading': 0,
    'react/react-in-jsx-scope': 0,
    'react/jsx-uses-react': 0,
    'react/prop-types': 0,
    'react/jsx-sort-props': 2,
    'react/jsx-no-useless-fragment': 0,

    camelcase: 0,
    'redux-saga/no-yield-in-race': 2,
    'redux-saga/yield-effects': 2,

    // ignore unused prefixed with _
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/no-shadow': 2,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/no-non-null-assertion': 0,

    'import/order': 0,
    'simple-import-sort/exports': 2,
    'simple-import-sort/imports': [
      2,
      {
        groups: [
          ['^\\u0000'],
          [
            '^(?!components|constants|containers|hooks|hoc|images|translations|utils)@?\\w',
          ],
          [
            'commons',
            'commonElements',
            'commonModules',
            'commonUtils',
            'commonVariables',
          ],
          ['^'],
          ['^\\.'],
        ],
      },
    ],

    'import/extensions': [
      2,
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
  },
  settings: {
    'import/resolver': {
      webpack: {
        config: {
          resolve: {
            modules: ['node_modules', 'app'],
            alias: {
              react: 'preact/compat',
              'react-dom': 'preact/compat', // Must be below test-utils
              'react-dom/client': 'preact/compat/client', // Must be below test-utils
              'react/jsx-runtime': 'preact/jsx-runtime',

              root: path.resolve(__dirname, ''),
              containers: path.resolve(__dirname, 'app/containers'),
              components: path.resolve(__dirname, 'app/components'),
            },
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.react.js'],
            mainFields: ['browser', 'jsnext:main', 'main'],
          },
        },
      },
    },
  },
  overrides: [
    {
      files: ['**/*.tsx'],
      rules: {
        'react/prop-types': 'off',
      },
    },
    {
      files: ['**/*.mjs'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: {
        'import/no-import-module-exports': 'off',
      },
    },
  ],
};
