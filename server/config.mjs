import argv from './argv.mjs';

// Port configuration
export const port = parseInt(argv.port || process.env.PORT || '3000', 10);

// Host configuration
const customHost = argv.host || process.env.HOST;
export const host = customHost || null; // Let http.Server use its default IPv6/4 host
export const prettyHost = customHost || 'localhost';

// Public path for webpack
export const publicPath = `http://${prettyHost}:${port}/`;
