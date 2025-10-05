/* eslint-disable no-console */
import { readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Automatically loads all route files from the routes directory
 * @param {Object} fastify - Fastify instance
 * @param {string} routesDir - Path to routes directory
 */
export async function loadRoutes(fastify, routesDir = '../routes') {
  const routesPath = join(__dirname, routesDir);

  try {
    const files = await readdir(routesPath);
    const routeFiles = files.filter(
      (file) =>
        (file.endsWith('.routes.mjs') || file.endsWith('.routes.js')) &&
        !file.startsWith('.'),
    );

    await Promise.all(
      routeFiles.map(async (file) => {
        const routePath = join(routesPath, file);
        const routeModule = await import(`file://${routePath}`);

        if (routeModule.default && typeof routeModule.default === 'function') {
          await routeModule.default(fastify);
          console.log(`✓ Loaded route: ${file}`);
        } else {
          console.warn(
            `⚠ Route file ${file} does not export a default function`,
          );
        }
      }),
    );

    console.log(`✓ All routes loaded from ${routesDir}`);
  } catch (error) {
    console.error(`✗ Error loading routes from ${routesDir}:`, error.message);
  }
}
