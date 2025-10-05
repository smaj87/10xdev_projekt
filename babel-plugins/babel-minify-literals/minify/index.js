/* eslint-disable no-plusplus */
// This file is a copy of minify.js from https://github.com/styled-components/babel-plugin-styled-components/blob/main/src/minify/index.js

// The capture group makes sure that the split contains the interpolation index
const placeholderRegex = /(?:__PLACEHOLDER_(\d+)__)/g;

// Alternative regex that splits without a capture group
const placeholderNonCapturingRegex = /__PLACEHOLDER_(?:\d+)__/g;

// Generates a placeholder from an index
const makePlaceholder = (index) => `__PLACEHOLDER_${index}__`;

// Splits CSS by placeholders
const splitByPlaceholders = ([css, ...rest], capture = true) => [
  css.split(capture ? placeholderRegex : placeholderNonCapturingRegex),
  ...rest,
];

const injectUniquePlaceholders = (strArr) => {
  let i = 0;

  return strArr.reduce(
    (str, val, index, arr) =>
      str + val + (index < arr.length - 1 ? makePlaceholder(i++) : ''),
    '',
  );
};

const makeMultilineCommentRegex = (newlinePattern) =>
  new RegExp(`\\/\\*[^!](.|${newlinePattern})*?\\*\\/`, 'g');
const lineCommentStart = /\/\//g;
const symbolRegex = /(\s*[;:{},]\s*)/g;

// Counts occurences of substr inside str
const countOccurences = (str, substr) => str.split(substr).length - 1;

// Joins substrings until predicate returns true
const reduceSubstr = (substrs, join, predicate) => {
  const { length } = substrs;
  let res = substrs[0];

  if (length === 1) {
    return res;
  }

  for (let i = 1; i < length; i++) {
    if (predicate(res)) {
      break;
    }

    res += join + substrs[i];
  }

  return res;
};

// Joins at comment starts when it's inside a string or parantheses
// effectively removing line comments
const stripLineComment = (line) =>
  reduceSubstr(
    line.split(lineCommentStart),
    '//',
    (str) =>
      !str.endsWith(':') && // NOTE: This is another guard against urls, if they're not inside strings or parantheses.
      countOccurences(str, "'") % 2 === 0 &&
      countOccurences(str, '"') % 2 === 0 &&
      countOccurences(str, '(') === countOccurences(str, ')'),
  );

const compressSymbols = (code) =>
  code.split(symbolRegex).reduce((str, fragment, index) => {
    // Even-indices are non-symbol fragments
    if (index % 2 === 0) {
      return str + fragment;
    }

    // Only manipulate symbols outside of strings
    if (
      countOccurences(str, "'") % 2 !== 0 ||
      countOccurences(str, '"') % 2 !== 0
    ) {
      return str + fragment;
    }

    // Preserve whitespace preceding colon, to avoid joining selectors.
    if (/^\s+:/.test(fragment)) {
      return `${str} ${fragment.trim()}`;
    }

    return str + fragment.trim();
  }, '');

// Detects lines that are exclusively line comments
const isLineComment = (line) => line.trim().startsWith('//');

// Creates a minifier with a certain linebreak pattern
const minify = (linebreakPattern) => {
  const linebreakRegex = new RegExp(`${linebreakPattern}\\s*`, 'g');
  const multilineCommentRegex = makeMultilineCommentRegex(linebreakPattern);

  return (code) => {
    const newCode = code
      .replace(multilineCommentRegex, '\n') // Remove multiline comments
      .split(linebreakRegex) // Split at newlines
      .filter((line) => line.length > 0 && !isLineComment(line)) // Removes lines containing only line comments
      .map(stripLineComment) // Remove line comments inside text
      .join(' '); // Rejoin all lines

    // const eliminatedExpressionIndices = difference(
    //   code.match(placeholderRegex),
    //   newCode.match(placeholderRegex),
    // ).map((x) => parseInt(x.match(/\d+/)[0], 10));

    return [compressSymbols(newCode)];
  };
};

const minifyRaw = minify('(?:\\\\r|\\\\n|\\r|\\n)');
const minifyCooked = minify('[\\r\\n]');

module.exports = {
  minifyRawValues: function minifyRawValues(rawValues) {
    return splitByPlaceholders(
      minifyRaw(injectUniquePlaceholders(rawValues)),
      false,
    );
  },
  minifyCookedValues: function minifyCookedValues(cookedValues) {
    return splitByPlaceholders(
      minifyCooked(injectUniquePlaceholders(cookedValues)),
      false,
    );
  },
};
