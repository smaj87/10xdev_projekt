/*
 * This plugin minifies template strings
 *
 * Currently minimized tagged template expressions:
 * - styled('')``
 * - css``
 * - createGlobalStyle('')``
 * - htmlTemplateTag``
 */
const { minifyCookedValues, minifyRawValues } = require('./minify');

module.exports = function babelMinifyTemplateLiterals(babel) {
  const t = babel.types;

  return {
    visitor: {
      TaggedTemplateExpression(path) {
        const isStyledFn =
          t.isCallExpression(path.node.tag) &&
          path.node.tag.callee.name === 'styled';
        const isCreateGlobalStyleFn =
          t.isCallExpression(path.node.tag) &&
          path.node.tag.callee.name === 'createGlobalStyle';
        const isCssLiteral = t.isIdentifier(path.node.tag, { name: 'css' });
        const isHtmlLiteral = t.isIdentifier(path.node.tag, {
          name: 'htmlTemplateTag',
        });

        if (
          isStyledFn ||
          isCssLiteral ||
          isCreateGlobalStyleFn ||
          isHtmlLiteral
        ) {
          const templateLiteral = path.node.quasi;
          const quasisLength = templateLiteral.quasis.length;

          const [rawValuesMinified] = minifyRawValues(
            templateLiteral.quasis.map((x) => x.value.raw),
          );

          const [cookedValuesMinfified] = minifyCookedValues(
            templateLiteral.quasis.map((x) => x.value.cooked),
          );

          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < quasisLength; i++) {
            const element = templateLiteral.quasis[i];

            element.value.raw = rawValuesMinified[i];
            element.value.cooked = cookedValuesMinfified[i];
          }
        }
      },
    },
  };
};
