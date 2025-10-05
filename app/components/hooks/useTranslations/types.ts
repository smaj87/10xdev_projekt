import { Lang } from 'components/translations/types';

import { KEY, SET_LANG } from './constants';

export interface LanguageState {
  lang: Lang;
}

export interface LanguageRootState {
  [KEY]: LanguageState;
}

export type LanguageAction = {
  type: typeof SET_LANG;
  lang: LanguageState['lang'];
};
