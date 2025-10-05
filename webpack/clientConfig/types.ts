export interface AppConfig {
  API_URL: string;
  VERSION: string;
  LANGS: boolean;
}

export interface TemplateData {
  TITLE: string;
  BROWSER_UPDATE_URL: string;
  VERSION: string;
  PREFETCH_LINKS: string[];
  PRELOAD_LINKS: string[];
}
