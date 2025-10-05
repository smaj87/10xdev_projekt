const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const generate = require('@babel/generator').default;

// eslint-disable-next-line func-names
module.exports = function (source) {
  const options = this.query;
  const { substringsToRemove } = options;

  const ast = parse(source, { sourceType: 'module' });

  traverse(ast, {
    Property(path) {
      const {
        node: { key },
      } = path;

      substringsToRemove.every((substringToRemove) => {
        if (t.isIdentifier(key) && key.name?.includes(substringToRemove)) {
          path.remove();

          return false;
        }
        if (t.isLiteral(key) && key.value?.includes(substringToRemove)) {
          path.remove();

          return false;
        }

        return true;
      });
    },
  });

  const { code } = generate(ast);

  return code;
};
