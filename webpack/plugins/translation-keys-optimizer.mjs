import { parse } from '@babel/parser';
import babelTraverse from '@babel/traverse';
import t from '@babel/types';
import chalk from 'chalk';
import fs from 'fs';
import filePath from 'path';
import webpack from 'webpack';

const traverse = babelTraverse.default;

const combining = /[\u0300-\u036F]/g;

let tVarsIndex = 10;
const tVarsMap = {};
const tValuesArray = [];
const duplicatedValues = [];

const checkValueDuplicate = (value) => {
  if (t.isLiteral(value)) {
    const normalizedValue = value.value
      ?.normalize('NFKD')
      .replace(combining, '')
      .replace(/ł/gi, 'l');

    if (tValuesArray.includes(normalizedValue)) {
      duplicatedValues.push(value.value);
    } else {
      tValuesArray.push(normalizedValue);
    }
  }
};

class TranslationKeysOptimizerWebpackPlugin {
  constructor(options) {
    this.usedTranslationKeys = [];
    this.unusedTranslationKeys = [];
    this.substringsToRemove = options.substringsToRemove;
    this.filesWithTranslations = options.filesWithTranslations;
  }

  apply(compiler) {
    /*
     *  Fill initial tVarsMap for better minification
     */
    try {
      this.filesWithTranslations.forEach((link) => {
        const path = filePath.resolve(process.cwd(), link);
        const data = fs.readFileSync(path, 'utf8');
        const regex = /\s{2}('[\w/]+'|[\w/]+):/g;
        const matches = Array.from(data.matchAll(regex), (match) => match[1]);

        matches.forEach((matchKey) => {
          const key = matchKey.replace(/'/gi, '').replace(/\//gi, '_');

          let newValue = key.charAt(0) !== '_' ? tVarsMap[key] : key;

          if (!newValue) {
            do {
              newValue = `${tVarsIndex.toString(36)}`;
              tVarsIndex += 1;
            } while (/[0-9]/.test(newValue.charAt(0)));

            tVarsMap[key] = newValue;
          }
        });
      });
    } catch {}

    /*
     *  Add translation loaders
     */
    compiler.hooks.compilation.tap(
      'TranslationKeysOptimizerWebpackPlugin',
      (compilation) => {
        webpack.NormalModule.getCompilationHooks(compilation).loader.tap(
          'TranslationKeysOptimizerWebpackPlugin',
          (_, module) => {
            if (
              /translations(\/|\\)langs(\/|\\)\w+.tsx?$/.test(module.resource)
            ) {
              module.loaders.unshift({
                loader: filePath.resolve(
                  process.cwd(),
                  'webpack/loaders/remove-translations-loader.cjs',
                ),
                options: {
                  substringsToRemove: this.substringsToRemove,
                },
              });
            }
            if (
              /\.(js|jsx|ts|tsx)$/.test(module.resource) &&
              !module.resource.includes('node_modules')
            ) {
              module.loaders.unshift({
                loader: 'string-replace-loader',
                options: {
                  search:
                    // "\\s{2}'([a-z0-9_/]+)':|([^a-z_])t\\('([a-z0-9_]+)'(,\\s*[^)]+)?\\)",
                    "\\s{2}('[a-z0-9_/]+'|[a-z0-9_/]+):|([^a-z_])t\\(\\s*'([a-z0-9_/]+)'",
                  replace(match, oKey, tChar = '', tKey = undefined) {
                    const isLangs = /langs(\\|\/.*\.(js|ts|jsx|tsx)$)/gi.test(
                      this.resource,
                    );

                    if ((oKey && isLangs) || (tKey && !isLangs)) {
                      const key = (oKey || tKey)
                        .replace(/'/gi, '')
                        .replace(/\//gi, '_');

                      // no children because of react components in translations
                      if (key !== 'children') {
                        let newValue =
                          key.charAt(0) !== '_' ? tVarsMap[key] : key;

                        if (!newValue) {
                          do {
                            newValue = `${tVarsIndex.toString(36)}`;
                            tVarsIndex += 1;
                          } while (/[0-9]/.test(newValue.charAt(0)));
                          tVarsMap[key] = newValue;
                        }

                        return tKey
                          ? `${tChar}t('${tVarsMap[key] || tKey}'`
                          : `${newValue}:`;
                      }
                    }

                    return oKey ? `${oKey}:` : match;
                  },
                  flags: 'gi',
                },
              });
            }
          },
        );
      },
    );

    compiler.hooks.thisCompilation.tap(
      'TranslationKeysOptimizerWebpackPlugin',
      (compilation) => {
        compilation.hooks.optimizeModules.tap(
          'TranslationKeysOptimizerWebpackPlugin',
          (modules) => {
            /*
             *  Get used translations, search t('SOME_STRING')
             */
            modules.forEach((module) => {
              if (
                module &&
                module._source &&
                typeof module._source.source === 'function' &&
                /\.(js|jsx|ts|tsx)$/.test(module.resource)
              ) {
                const sourceCode = module._source.source();
                if (sourceCode) {
                  const regex = /[^a-z_]t\(\s*'([\w/]+)'/g;
                  const matches = Array.from(
                    sourceCode.matchAll(regex),
                    (match) => match[1],
                  );
                  matches.forEach((key) => {
                    this.usedTranslationKeys.push(key);
                  });
                }
              }
            });
            /*
             *  Get unused translation keys, search inside translations files
             */
            modules.forEach((module) => {
              if (
                module &&
                module._source &&
                typeof module._source.source === 'function'
              ) {
                const sourceCode = module._source.source();
                if (
                  module.resource.includes('translations/langs/pl') ||
                  module.resource.includes('translations\\langs\\pl')
                ) {
                  const ast = parse(sourceCode, { sourceType: 'module' });
                  // eslint-disable-next-line @typescript-eslint/no-this-alias
                  const _this = this;
                  traverse(ast, {
                    ExportDefaultDeclaration(path) {
                      path.node?.declaration?.properties?.forEach(
                        (property) => {
                          const { key, value } = property;
                          if (t.isIdentifier(key)) {
                            if (!_this.usedTranslationKeys.includes(key.name)) {
                              _this.unusedTranslationKeys.push(key.name);
                            }
                            if (process.env.NODE_ENV === 'production') {
                              checkValueDuplicate(value);
                            }
                          }
                          if (t.isLiteral(key)) {
                            if (
                              !_this.usedTranslationKeys.includes(key.value)
                            ) {
                              _this.unusedTranslationKeys.push(key.value);
                            }
                            if (process.env.NODE_ENV === 'production') {
                              checkValueDuplicate(value);
                            }
                          }
                        },
                      );
                    },
                  });
                }
              }
            });

            /*
             *  Show all duplicated values
             */
            if (duplicatedValues.length) {
              process.stdout.write(
                chalk.yellow(
                  `\n[Warning]Duplicated values: ${duplicatedValues} \n`,
                ),
              );
            }

            /*
             *  Map minified key names
             */
            const tKeysMap = {};
            Object.keys(tVarsMap).forEach((key) => {
              tKeysMap[tVarsMap[key]] = key.replaceAll('_', '/');
            });

            const unminifiedUnusedTranslationKeys = this.unusedTranslationKeys
              .map((key) => tKeysMap[key])
              .filter(Boolean);

            /*
             *  Log unused translation keys
             */
            if (unminifiedUnusedTranslationKeys.length) {
              process.stdout.write(
                chalk.yellow(
                  `\n[Warning]Unused translations: ${unminifiedUnusedTranslationKeys} \n`,
                ),
              );
            }
          },
        );
      },
    );
  }
}

export default TranslationKeysOptimizerWebpackPlugin;
