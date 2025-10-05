import { SET_LANG } from './constants';
import { LanguageState } from './types';

export const setLang = (lang: LanguageState['lang']) => ({
  type: SET_LANG,
  lang,
});
