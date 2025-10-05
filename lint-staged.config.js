module.exports = {
  '*.(js|jsx|ts|tsx)': ['npm run lint:eslint', 'stylelint'],
  '*.json': ['prettier --write'],
  '**/*.(ts|tsx)': () => 'npm run check-types',
};
