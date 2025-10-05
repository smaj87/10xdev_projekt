import fs from 'fs';
import { pathToFileURL } from 'url';

const exts = [
  `.${process.env.APP}.cjs`,
  `.${process.env.APP}.mjs`,
  `.${process.env.APP}.js`,
  `.cjs`,
  `.mjs`,
  `.js`,
];

/**
 * @param {string} path - Path to the file to import
 * @returns {Promise<any>} Imported module
 */
export default async (path) => {
  let config = null;
  let filePath = `${process.cwd()}${path}`;

  exts.every((ext) => {
    const currentPath = `${filePath}${ext}`;

    if (fs.existsSync(currentPath)) {
      filePath = currentPath;
      return false;
    }

    return true;
  });

  try {
    config = await import(pathToFileURL(filePath).href);
  } catch {
    const divider =
      '\n------------------------------------------------------------------------\n';

    // eslint-disable-next-line no-console
    console.error(`${divider}File not exists: ${filePath}${divider}`);

    throw new Error('File not found');
  }

  return config;
};
