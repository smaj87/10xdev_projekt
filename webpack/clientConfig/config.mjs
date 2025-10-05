import { version } from '../../server/utils/version.mjs';

/** @type {import('./types').AppConfig} */
const APP_CONFIG = {
  API_URL: '/api',
  VERSION: version,
  LANGS: true,
};

/** @type {import('./types').TemplateData} */
const TEMPLATE_DATA = {
  TITLE: '',
  BROWSER_UPDATE_URL: '',
  VERSION: version,
  PREFETCH_LINKS: [],
  PRELOAD_LINKS: [],
};

/**
 * @type {{ templateData: import('./types').TemplateData, config: import('./types').AppConfig }}
 */
export default { config: APP_CONFIG, templateData: TEMPLATE_DATA };
