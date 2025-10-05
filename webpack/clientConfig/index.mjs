// @ts-check
import importResolver from '../../server/utils/importResolver.mjs';

const config = await importResolver('/webpack/clientConfig/config');
/**
 * @type {{ DEFAULT_CONFIG: import('./types').AppConfig, config: import('./types').AppConfig }}
 */
export default config;
