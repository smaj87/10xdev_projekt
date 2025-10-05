/* eslint-disable no-console */

import chalk from 'chalk';

import clientInfoLogger from './utils/clientInfoLogger.mjs';

const divider = chalk.gray('\n-----------------------------------');

/**
 * Logger middleware, you can customize it to make messages more personal
 */
const logger = {
  // Called whenever there's an error on the server we want to print
  error: (err) => {
    console.error(chalk.red(err));
  },

  // Called when express.js app starts on given port w/o errors
  appStarted: (port, host, tunnelStarted) => {
    console.log(`Server started ! ${chalk.green('✓')}`);

    // If the tunnel started, log that and the URL it's available at
    if (tunnelStarted) {
      console.log(`Tunnel initialised ${chalk.green('✓')}`);
    }

    const title = `${chalk.bold('Access URL:')}${divider}`;
    const footer = chalk.blue(`\nPress ${chalk.italic('CTRL-C')} to stop`);

    const localhostAddress = `Localhost: ${chalk.magenta(
      `http://${host}:${port}`,
    )}`;

    console.log(`\n${title}\n${localhostAddress}${divider}`);

    clientInfoLogger();

    console.log(footer);
  },
};

export default logger;
