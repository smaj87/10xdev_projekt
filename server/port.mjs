import argv from './argv.mjs';

export default parseInt(argv.port || process.env.PORT || '3000', 10);
