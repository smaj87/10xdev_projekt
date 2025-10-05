import chalk from 'chalk';

import { dirVersion } from './version.mjs';

const divider = chalk.green('\n---------------------------------------');
const libName = chalk.green('preact');
const version = `(${chalk.gray(dirVersion)})`;

export default () => {
  const node_version = `NodeJS version: ${process.version}`;

  // eslint-disable-next-line no-console
  console.log(
    `${divider}\nClient info ${version}: - ${libName}\n${node_version}${divider}`,
  );
};
