import chalk from 'chalk';
import fs from 'fs';

const exts = {
  client: `.${process.env.APP}.ejs`,
  default: '.ejs',
};

const getTemplatePath = () => {
  const templatePath = 'app/templates/index';
  let path = '';
  const filePath = `${process.cwd()}/${templatePath}`;

  if (fs.existsSync(`${filePath}${exts.client}`)) {
    path = `${templatePath}${exts.client}`;
  } else if (fs.existsSync(`${filePath}${exts.default}`)) {
    path = `${templatePath}${exts.default}`;
  } else {
    const divider = chalk.red(
      '\n------------------------------------------------------------------------\n',
    );

    // eslint-disable-next-line no-console
    console.error(
      `${divider}${chalk.red.bold('!!!ERROR!!!\n')}`,
      chalk.red('Template not exists. Create:\n'),
      chalk.red.bold(`${templatePath}${exts.client}`),
      chalk.red('or'),
      chalk.red.bold(`${templatePath}${exts.default}`),
      `${divider}`,
    );

    throw new Error('Template not found');
  }

  return path;
};

const templatePath = getTemplatePath();

export default templatePath;
